import matter from 'gray-matter';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import {expectNever, requiredFFVersionRegex} from '../util/util';
import semver from 'semver';
import {pipe} from 'fp-ts/lib/pipeable';
import {ArrayFieldValue, Config, Field, FieldValue, PrimitiveFieldValue} from '../config/type';
import {Note} from './note';
import {readdir, readFile, sequenceKeepAllLefts} from '../fp/fp';

export const parseNotes = (config: Config, folder: string): TE.TaskEither<Array<FileParseError | string>, Note[]> => {
    return pipe(
        readdir(folder),
        TE.mapLeft((e): Array<FileParseError | string> => [e]),
        TE.map((files) => readNotes(config.fields, files)),
        TE.flatten
    );
};

const readNotes = (fields: Field[], files: string[]): TE.TaskEither<Array<FileParseError | string>, Note[]> => {
    return pipe(
        A.array.traverse(T.task)(files, (file) => readNote(fields, file)),
        T.map(sequenceKeepAllLefts),
        TE.mapLeft(A.flatten)
    );
};

export const readNote = (fields: Field[], fileName: string): TE.TaskEither<Array<FileParseError | string>, Note> => {
    return pipe(
        readFile(fileName),
        TE.mapLeft((e) => [e]),
        TE.chainEitherK((rawNote): E.Either<Array<FileParseError | string>, Note> => parseNote(fields, rawNote, fileName))
    );
};

export const errorToString = (errors: Array<FileParseError | string>): string => {
    return errors
        .map((error) => {
            if (typeof error === 'string') {
                return error;
            }
            return `${error.file}: field(${error.field}): ${error.error} ${error.msg ?? ''}`;
        })
        .join('\n');
};

export const parseNote = (fields: Field[], note: string, fileName: string): E.Either<FileParseError[], Note> => {
    const {content: content, ...meta} = matter(note);
    const [first, ...other] = content.split('\n\n');

    type FieldWithValue = [string, FieldValue | undefined];

    return pipe(
        fields,
        A.map(
            (field): E.Either<FileParseError, FieldWithValue> =>
                pipe(
                    parseFieldValue(field, meta.data, true),
                    E.map((value): FieldWithValue => [field.name, value]),
                    E.mapLeft((parseError: ParseError): FileParseError => ({...parseError, file: fileName}))
                )
        ),
        sequenceKeepAllLefts,
        E.map((fieldsWithValue) => Object.fromEntries(fieldsWithValue.filter(([, value]) => typeof value !== 'undefined'))),
        E.map((values) => ({values, id: fileName, file: fileName, content: other.join('\n\n'), summary: first.replace(/^\s*#\s*/, '')}))
    );
};

export type ParseErrorType = 'missingField' | 'wrongType' | 'invalidSemVer' | 'invalidEnum' | 'invalidFFVersion';

export interface ParseError {
    error: ParseErrorType;
    msg?: string;
    field: string;
}

export interface FileParseError extends ParseError {
    file: string;
}

const typeError = (field: string, expected: string, actual: unknown): ParseError => {
    return {error: 'wrongType', msg: `expected ${expected}, got ${typeof actual}`, field};
};

const parseString = (value: unknown, field: Field): E.Either<ParseError, string> => {
    if (typeof value !== 'string') {
        return E.left(typeError(field.name, 'string', value));
    }
    if (field.enum && !field.enum.includes(value)) {
        return E.left({
            error: 'invalidEnum',
            msg: `expected one of [${field.enum.join(', ')}], got '${value}'`,
            field: field.name,
        });
    }
    return E.right(value);
};

const parseBoolean = (value: unknown, field: Field, strict: boolean): E.Either<ParseError, boolean> => {
    if (!strict && typeof value === 'string' && (value === 'true' || value === 'false')) {
        return E.right(value === 'true');
    }
    if (typeof value === 'boolean') {
        return E.right(value);
    }
    return E.left(typeError(field.name, 'boolean', value));
};

const parseNumber = (value: unknown, field: Field, strict: boolean): E.Either<ParseError, number> => {
    if (typeof value === 'number') {
        return E.right(value);
    }

    if (!strict && typeof value === 'string' && /^-?\d+(.\d+)?$/.exec(value)) {
        return E.right(parseFloat(value));
    }

    return E.left(typeError(field.name, 'number', value));
};

const parseDate = (value: unknown, field: Field): E.Either<ParseError, number> => {
    if (typeof value !== 'string') {
        return E.left(typeError(field.name, 'date string', value));
    }
    return E.right(Date.parse(value));
};

const parseSemver = (value: unknown, field: Field): E.Either<ParseError, semver.SemVer> => {
    if (typeof value !== 'string') {
        return E.left(typeError(field.name, 'semver string', value));
    }
    const version = semver.parse(value);
    if (version === null) {
        return E.left({error: 'invalidSemVer', msg: `expected valid semver, got '${value}'`, field: field.name});
    }
    return E.right(version);
};
const parseFFVersion = (value: unknown, field: Field): E.Either<ParseError, string> => {
    if (typeof value !== 'string') {
        return E.left(typeError(field.name, 'string', value));
    }
    if (!requiredFFVersionRegex.exec(value)) {
        return E.left({error: 'invalidFFVersion', msg: `expected valid ffversion in format '1.0.0-1', got '${value}'`, field: field.name});
    }
    return E.right(value);
};

const parseSingleValue = (value: unknown, field: Field, strict: boolean): E.Either<ParseError, PrimitiveFieldValue> => {
    switch (field.type) {
        case 'string':
            return parseString(value, field);
        case 'boolean':
            return parseBoolean(value, field, strict);
        case 'date':
            return parseDate(value, field);
        case 'number':
            return parseNumber(value, field, strict);
        case 'semver':
            return parseSemver(value, field);
        case 'ffversion':
            return parseFFVersion(value, field);
        default:
            return expectNever(field.type);
    }
};

const parseListValue = (values: unknown, field: Field, strict): E.Either<ParseError, ArrayFieldValue> => {
    if (!Array.isArray(values)) {
        return E.left(typeError(field.name, 'array', values));
    }

    return A.array.traverse(E.either)(values, (value) => parseSingleValue(value, field, strict));
};

export const parseFieldValue = (field: Field, meta: Record<string, unknown>, strict = true): E.Either<ParseError, FieldValue | undefined> => {
    if (!(field.name in meta)) {
        return field.optional || field.provided ? E.right(undefined) : E.left({error: 'missingField', field: field.name});
    }

    return field.list === true ? parseListValue(meta[field.name], field, strict) : parseSingleValue(meta[field.name], field, strict);
};
