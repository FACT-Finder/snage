import matter from 'gray-matter';
import {Either, isLeft, left, map, right} from 'fp-ts/lib/Either';
import {expectNever, requiredFFVersionRegex} from '../util/util';
import semver from 'semver';
import {pipe} from 'fp-ts/lib/pipeable';
import fs from 'fs';
import path from 'path';
import {Config, Field} from '../config/type';
import {Note} from './note';

export const parseNotes = (config: Config, folder: string): Note[] => {
    return fs.readdirSync(folder).map((file) => {
        const filePath = path.join(folder, file);
        const note = parseNote(config.fields, fs.readFileSync(filePath, 'utf8'), filePath);
        if (isLeft(note)) {
            throw new Error(JSON.stringify(note.left));
        }
        return note.right;
    });
};

export const parseNote = (fields: Field[], note: string, fileName = 'unset'): Either<ParseError, Note> => {
    const {content: content, ...meta} = matter(note);

    let mutableMeta = meta.data;
    for (const field of fields) {
        const eitherMeta: Either<ParseError, Record<string, unknown>> = parseField(field, meta.data);
        if (isLeft(eitherMeta)) {
            return left(eitherMeta.left);
        }
        mutableMeta = {...mutableMeta, ...eitherMeta.right};
    }
    const [first, ...other] = content.split('\n\n');
    return right({values: mutableMeta, id: fileName, file: fileName, content: other.join('\n\n'), summary: first.replace(/^\s*#\s*/, '')});
};

type ParseErrorType = 'missingField' | 'wrongType' | 'invalidSemVer' | 'invalidEnum' | 'invalidFFVersion';

export interface ParseError {
    error: ParseErrorType;
    msg?: string;
    field: string;
}

const typeError = (field: string, expected: string, actual: unknown): ParseError => {
    return {error: 'wrongType', msg: `expected ${expected}, got ${typeof actual}`, field};
};

const parseString = (value: unknown, field: Field): Either<ParseError, string> => {
    if (typeof value !== 'string') {
        return left(typeError(field.name, 'string', value));
    }
    if (field.enum && !field.enum.includes(value)) {
        return left({
            error: 'invalidEnum',
            msg: `expected one of [${field.enum.join(', ')}], got '${value}'`,
            field: field.name,
        });
    }
    return right(value);
};

const parseBoolean = (value: unknown, field: Field): Either<ParseError, boolean> => {
    if (typeof value !== 'boolean') {
        return left(typeError(field.name, 'boolean', value));
    }
    return right(value);
};

const parseNumber = (value: unknown, field: Field): Either<ParseError, number> => {
    if (typeof value !== 'number') {
        return left(typeError(field.name, 'number', value));
    }
    return right(value);
};

const parseDate = (value: unknown, field: Field): Either<ParseError, number> => {
    if (typeof value !== 'string') {
        return left(typeError(field.name, 'date string', value));
    }
    return right(Date.parse(value));
};

const parseSemver = (value: unknown, field: Field): Either<ParseError, semver.SemVer> => {
    if (typeof value !== 'string') {
        return left(typeError(field.name, 'semver string', value));
    }
    const version = semver.parse(value);
    if (version === null) {
        return left({error: 'invalidSemVer', msg: `expected valid semver, got '${value}'`, field: field.name});
    }
    return right(version);
};
const parseFFVersion = (value: unknown, field: Field): Either<ParseError, string> => {
    if (typeof value !== 'string') {
        return left(typeError(field.name, 'string', value));
    }
    if (!requiredFFVersionRegex.exec(value)) {
        return left({error: 'invalidFFVersion', msg: `expected valid ffversion in format '1.0.0-1', got '${value}'`, field: field.name});
    }
    return right(value);
};

const parseSingleValue = (value: unknown, field: Field): Either<ParseError, unknown> => {
    switch (field.type) {
        case 'string':
            return parseString(value, field);
        case 'boolean':
            return parseBoolean(value, field);
        case 'date':
            return parseDate(value, field);
        case 'number':
            return parseNumber(value, field);
        case 'semver':
            return parseSemver(value, field);
        case 'ffversion':
            return parseFFVersion(value, field);
        default:
            return expectNever(field.type);
    }
};

const parseList = (value: unknown, field: Field): Either<ParseError, unknown[]> => {
    if (!Array.isArray(value)) {
        return left(typeError(field.name, 'array', value));
    }

    const parsed: Array<Either<ParseError, unknown>> = value.map((x) => parseSingleValue(x, field));
    const result: unknown[] = [];
    for (const x of parsed) {
        if (isLeft(x)) {
            return x;
        } else {
            result.push(x.right);
        }
    }
    return right(result);
};

export const parseField = (field: Field, meta: Record<string, unknown>): Either<ParseError, Record<string, unknown>> => {
    if (!(field.name in meta)) {
        return field.optional ? right({}) : left({error: 'missingField', field: field.name});
    }

    const parsed = field.list === true ? parseList(meta[field.name], field) : parseSingleValue(meta[field.name], field);
    return pipe(
        parsed,
        map((x) => ({[field.name]: x}))
    );
};
