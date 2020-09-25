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
import {NoteValues, StringNoteValues, YamlFieldValue, YamlNoteValues} from './note';
import {ReportMode, stringifyErrors} from './reporter';

export type ConvertField = Pick<Field, 'name' | 'type' | 'enum' | 'list'>;

export const decodeHeader = (fields: ConvertField[], values): E.Either<string[], Record<string, FieldValue>> =>
    pipe(
        getNoteIOType(fields).decode(values),
        E.bimap(
            stringifyErrors(ReportMode.WithPath),
            R.filter((v): v is FieldValue => typeof v !== 'undefined')
        )
    );
export const decodeStringHeader = (
    fields: ConvertField[],
    values: StringNoteValues
): E.Either<string[], Record<string, FieldValue>> =>
    pipe(
        getNoteStringIOType(fields).decode(values),
        E.bimap(
            stringifyErrors(ReportMode.WithPath),
            R.filter((v): v is FieldValue => typeof v !== 'undefined')
        )
    );

export const encodeHeader = (fields: ConvertField[], values: NoteValues): YamlNoteValues =>
    pipe(
        getNoteIOType(fields).encode(values),
        R.filter((v): v is YamlFieldValue => typeof v !== 'undefined')
    );

export const encodeValue = (field: ConvertField, value: FieldValue): YamlFieldValue =>
    getIOFieldType(field.type, field).encode(value as never);

export const stringEncodeHeader = (fields: ConvertField[], values: NoteValues): Record<string, string | string[]> =>
    pipe(
        getNoteStringIOType(fields).encode(values),
        R.filter((v): v is string | string[] => typeof v !== 'undefined')
    );

export const encodeStringValue = <Type extends FieldType>(
    type: Type,
    field: ConvertField,
    value: FieldValue
): string | string[] => getIOStringFieldType(type, field).encode(value as never);

export const decodeValue = (field: ConvertField, value: unknown): E.Either<string[], FieldValue> => {
    const decoded: E.Either<Errors, FieldValue> = getIOFieldType(field.type, field).decode(value);
    return E.either.mapLeft(decoded, stringifyErrors(ReportMode.Simple));
};

export const decodeStringValue = (field: ConvertField, value: string | string[]): E.Either<string[], FieldValue> => {
    const decoded: E.Either<Errors, FieldValue> = getIOStringFieldType(field.type, field).decode(value);
    return E.either.mapLeft(decoded, stringifyErrors(ReportMode.Simple));
};

const getNoteIOType = (fields: ConvertField[]): t.Type<Record<string, FieldValue | undefined>> =>
    t.partial(toRecord(fields.map((field) => [field.name, getIOFieldType(field.type, field)])), 'note');

const getNoteStringIOType = (
    fields: ConvertField[]
): t.Type<Record<string, FieldValue | undefined>, Record<string, string | string[] | undefined>> =>
    t.partial(toRecord(fields.map((field) => [field.name, getIOStringFieldType(field.type, field)])), 'note');

const getIOFieldType = <Type extends FieldType>(
    type: Type,
    field: ConvertField
): IOType[Type] | t.ArrayC<IOType[Type]> =>
    field.list ? t.array(getSingletonType(type, field), field.name) : getSingletonType(type, field);

const getIOStringFieldType = <Type extends FieldType>(
    type: Type,
    field: ConvertField
): IOStringType[Type] | t.ArrayC<IOStringType[Type]> =>
    field.list ? t.array(getSingletonStringType(type, field), field.name) : getSingletonStringType(type, field);

const getSingletonStringType = <Type extends FieldType>(type: Type, field: ConvertField): IOStringType[Type] =>
    ({
        boolean: booleanFromStringType,
        date: dateType,
        number: numberFromStringType,
        semver: semverType,
        ffversion: ffversionType,
        string: stringType(field),
    }[type]);

const getSingletonType = <Type extends FieldType>(type: Type, field: ConvertField): IOType[Type] =>
    ({
        boolean: t.boolean,
        date: dateType,
        number: number,
        semver: semverType,
        ffversion: ffversionType,
        string: stringType(field),
    }[type]);

const number = new t.Type<number, number, unknown>(
    'number',
    (u): u is number => typeof u === 'number' && !isNaN(u),
    (u, c) => E.either.chain(t.number.validate(u, c), (s) => (isNaN(s) ? t.failure(u, c) : t.success(s))),
    (a) => a
);

const semverType = new t.Type<semver.SemVer, string, unknown>(
    'semver(major.minor.patch[-prerelease])',
    (u): u is semver.SemVer => u instanceof semver.SemVer,
    (u, c) =>
        E.either.chain(t.string.validate(u, c), (s) => {
            const parsed = semver.parse(s);
            return semver.valid(s) ? t.success(parsed as semver.SemVer) : t.failure(u, c);
        }),
    (a) => a.format()
);

const dateType = new t.Type<LocalDate, string, unknown>(
    'date(YYYY-MM-DD)',
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
    'ffversion(marketing.major.minor-patch)',
    (u): u is string => typeof u === 'string',
    (u, c) =>
        E.either.chain(t.string.validate(u, c), (s) =>
            requiredFFVersionRegex.exec(s) ? t.success(s) : t.failure(u, c)
        ),
    (version) => version
);

const enumType = (values: string[]): t.Type<string> =>
    t.keyof(toRecord(values.map((a): [string, null] => [a, null]))) as t.Type<string>;

const stringType = (field: ConvertField): t.Type<string> => {
    if (typeof field.enum !== 'undefined') {
        return enumType(field.enum);
    }
    return t.string;
};

const booleanFromStringType = new t.Type<boolean, string, unknown>(
    'boolean',
    (u): u is boolean => typeof u === 'boolean',
    (u, c) => E.either.chain(enumType(['true', 'false']).validate(u, c), (s) => t.success(s === 'true')),
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
