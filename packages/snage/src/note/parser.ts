import matter from 'gray-matter';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import {expectNever, requiredFFVersionRegex} from '../util/util';
import semver from 'semver';
import {pipe} from 'fp-ts/lib/pipeable';
import fs from 'fs';
import path from 'path';
import {Config, Field} from '../config/type';
import {Note} from './note';

export const parseNotes = (config: Config, folder: string): E.Either<Array<FileParseError | string>, Note[]> => {
    return pipe(
        E.tryCatch(
            () => fs.readdirSync(folder),
            (e) => [`Could not read directory ${folder}: ${e}`]
        ),
        E.map(A.map((file) => path.join(folder, file))),
        E.map(
            A.map((filePath) =>
                pipe(
                    E.tryCatch(
                        () => fs.readFileSync(filePath, 'utf8'),
                        (e) => [`Could not read file ${filePath}: ${e}`]
                    ),
                    E.chain((content): E.Either<Array<string | FileParseError>, Note> => parseNote(config.fields, content, filePath))
                )
            )
        ),
        E.chain((e) => {
            const l = A.flatten(A.lefts(e));
            const r = A.rights(e);
            return l.length ? E.left(l) : E.right(r);
        })
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

    let mutableMeta = meta.data;
    const errors: FileParseError[] = [];
    for (const field of fields) {
        const eitherMeta: E.Either<ParseError, Record<string, unknown>> = parseField(field, meta.data, true);
        if (E.isLeft(eitherMeta)) {
            errors.push({...eitherMeta.left, file: fileName});
            continue;
        }
        mutableMeta = {...mutableMeta, ...eitherMeta.right};
    }
    if (errors.length) {
        return E.left(errors);
    }
    const [first, ...other] = content.split('\n\n');
    return E.right({values: mutableMeta, id: fileName, file: fileName, content: other.join('\n\n'), summary: first.replace(/^\s*#\s*/, '')});
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

const parseSingleValue = (value: unknown, field: Field, strict: boolean): E.Either<ParseError, unknown> => {
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

const parseList = (value: unknown, field: Field, strict): E.Either<ParseError, unknown[]> => {
    if (!Array.isArray(value)) {
        return E.left(typeError(field.name, 'array', value));
    }

    const parsed: Array<E.Either<ParseError, unknown>> = value.map((x) => parseSingleValue(x, field, strict));
    const result: unknown[] = [];
    for (const x of parsed) {
        if (E.isLeft(x)) {
            return x;
        } else {
            result.push(x.right);
        }
    }
    return E.right(result);
};

export const parseField = (field: Field, meta: Record<string, unknown>, strict = true): E.Either<ParseError, Record<string, unknown>> => {
    if (!(field.name in meta)) {
        return field.optional ? E.right({}) : E.left({error: 'missingField', field: field.name});
    }

    const parsed = field.list === true ? parseList(meta[field.name], field, strict) : parseSingleValue(meta[field.name], field, strict);
    return pipe(
        parsed,
        E.map((x) => ({[field.name]: x}))
    );
};
