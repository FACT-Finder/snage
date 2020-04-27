import {Field} from '../config/type';
import {format} from 'date-fns';
import SemVer from 'semver/classes/semver';
import {expectNever} from '../util/util';
import {NoteValues} from './note';

export const convertToYamlValues = (values: NoteValues, fields: Field[]): NoteValues => {
    return Object.entries(values).reduce(
        (acc, [key, value]) => ({...acc, [key]: convertFieldToYaml(fields.find((f) => f.name === key)!, value)}),
        {}
    );
};

export const convertFieldToYaml = (field: Field, value: unknown): unknown | unknown[] =>
    field.list ? convertListToYaml(field, value as unknown[]) : convertSingleValueToYaml(field, value);

export const convertListToYaml = (field: Field, value: unknown[]): unknown | unknown[] => value.map((v) => convertSingleValueToYaml(field, v));

export const convertSingleValueToYaml = (field: Field, value: unknown): unknown => {
    switch (field.type) {
        case 'date':
            return format(value as Date, 'yyyy-MM-dd');
        case 'semver':
            return (value as SemVer).format();
        case 'boolean':
        case 'number':
        case 'string':
        case 'ffversion':
            return value;
        default:
            return expectNever(field.type);
    }
};
