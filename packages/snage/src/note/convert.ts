import {Field, FieldType, FieldValue} from '../config/type';
import * as t from 'io-ts';
import {Errors} from 'io-ts';
import {requiredFFVersionRegex} from '../util/util';
import semver from 'semver';
import * as E from 'fp-ts/lib/Either';
import * as R from 'fp-ts/lib/Record';
import {LocalDate} from '@js-joda/core';
import {toRecord} from '../fp/fp';
import {pipe} from 'fp-ts/lib/pipeable';
import {PathReporter} from 'io-ts/lib/PathReporter';
import {NoteValues} from './note';

export const decodeHeader = (fields: Field[], values): E.Either<string[], Record<string, FieldValue>> => {
    return pipe(getNoteIOType(fields).decode(values), E.map(R.filter((v): v is FieldValue => typeof v !== 'undefined')), report);
};

export const encodeHeader = (fields: Field[], values: NoteValues): NoteValues => {
    return pipe(
        getNoteIOType(fields).encode(values),
        R.filter((v): v is FieldValue => typeof v !== 'undefined')
    );
};

export const stringEncodeHeader = (fields: Field[], values: NoteValues): Record<string, string | string[]> => {
    return pipe(
        getNoteStringIOType(fields).encode(values),
        R.filter((v): v is string | string[] => typeof v !== 'undefined')
    );
};

export const decodeValue = (field: Field, value: unknown): E.Either<string[], FieldValue> => {
    const decoded: E.Either<Errors, FieldValue> = getIOFieldType(field.type, field).decode(value);
    return report(decoded);
};

export const decodeStringValue = (field: Field, value: string | string[]): E.Either<string[], FieldValue> => {
    const decoded: E.Either<Errors, FieldValue> = getIOStringFieldType(field.type, field).decode(value);
    return report(decoded);
};

const report = <T>(decoded: E.Either<Errors, T>): E.Either<string[], T> => E.mapLeft(() => PathReporter.report(decoded))(decoded);

const getNoteIOType = (fields: Field[]): t.Type<Record<string, FieldValue | undefined>> =>
    t.partial(toRecord(fields.map((field) => [field.name, getIOFieldType(field.type, field)])), 'note');

const getNoteStringIOType = (fields: Field[]): t.Type<Record<string, FieldValue | undefined>, Record<string, string | string[] | undefined>> =>
    t.partial(toRecord(fields.map((field) => [field.name, getIOStringFieldType(field.type, field)])), 'note');

const getIOFieldType = <Type extends FieldType>(type: Type, field: Field): IOType[Type] | t.ArrayC<IOType[Type]> =>
    field.list ? t.array(getSingletonType(type, field), field.name) : getSingletonType(type, field);

const getIOStringFieldType = <Type extends FieldType>(type: Type, field: Field): IOStringType[Type] | t.ArrayC<IOStringType[Type]> =>
    field.list ? t.array(getSingletonStringType(type, field), field.name) : getSingletonStringType(type, field);

const getSingletonStringType = <Type extends FieldType>(type: Type, field: Field): IOStringType[Type] => {
    return {
        boolean: booleanFromStringType,
        date: dateType,
        number: numberFromStringType,
        semver: semverType,
        ffversion: ffversionType,
        string: stringType(field),
    }[type];
};

const getSingletonType = <Type extends FieldType>(type: Type, field: Field): IOType[Type] => {
    return {
        boolean: t.boolean,
        date: dateType,
        number: number,
        semver: semverType,
        ffversion: ffversionType,
        string: stringType(field),
    }[type];
};

const number = new t.Type<number, number, unknown>(
    'number',
    (u): u is number => typeof u === 'number' && !isNaN(u),
    (u, c) =>
        E.either.chain(t.number.validate(u, c), (s) => {
            return isNaN(s) ? t.failure(u, c) : t.success(s);
        }),
    (a) => a
);

const semverType = new t.Type<semver.SemVer, string, unknown>(
    'semver',
    (u): u is semver.SemVer => u instanceof semver.SemVer,
    (u, c) =>
        E.either.chain(t.string.validate(u, c), (s) => {
            const parsed = semver.parse(s);
            return semver.valid(s) ? t.success(parsed as semver.SemVer) : t.failure(u, c);
        }),
    (a) => a.format()
);

const dateType = new t.Type<LocalDate, string, unknown>(
    'YYYY-MM-DD',
    (u): u is LocalDate => u instanceof LocalDate,
    (u, c) =>
        E.either.chain(t.string.validate(u, c), (s) => {
            try {
                return t.success(LocalDate.parse(s));
            } catch (e) {
                return t.failure(u, c);
            }
        }),
    (date) => date.toString()
);

const ffversionType = new t.Type<string, string, unknown>(
    'ffversion',
    (u): u is string => typeof u === 'string',
    (u, c) => E.either.chain(t.string.validate(u, c), (s) => (requiredFFVersionRegex.exec(s) ? t.success(s) : t.failure(u, c))),
    (version) => version
);

const enumType = (values: string[]): t.Type<string> => {
    return t.keyof(toRecord(values.map((a): [string, null] => [a, null]))) as t.Type<string>;
};

const stringType = (field: Field): t.Type<string> => {
    if (typeof field.enum !== 'undefined') {
        return enumType(field.enum);
    }
    return t.string;
};

const booleanFromStringType = new t.Type<boolean, string, unknown>(
    'boolean',
    (u): u is boolean => typeof u === 'boolean',
    (u, c) =>
        E.either.chain(enumType(['true', 'false']).validate(u, c), (s) => {
            return t.success(s === 'true');
        }),
    (a) => a.toString()
);

const numberFromStringType = new t.Type<number, string, unknown>(
    'number',
    (u): u is number => typeof u === 'number',
    (u, c) =>
        E.either.chain(t.string.validate(u, c), (s) => {
            const number = parseFloat(s);
            return isNaN(number) ? t.failure(u, c) : t.success(number);
        }),
    (a) => a.toString()
);

type IOType = {[Key in FieldType]: t.Type<ATypeMapping[Key], OTypeMapping[Key]>};
type IOStringType = {[Key in FieldType]: t.Type<ATypeMapping[Key], string>};

interface ATypeMapping {
    number: number;
    semver: semver.SemVer;
    ffversion: string;
    string: string;
    date: LocalDate;
    boolean: boolean;
}

interface OTypeMapping {
    number: number;
    semver: string;
    ffversion: string;
    string: string;
    date: string;
    boolean: boolean;
}
