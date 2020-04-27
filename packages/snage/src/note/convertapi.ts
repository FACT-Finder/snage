import {Field} from '../config/type';
import {ApiNote} from '../../../shared/type';
import {Note} from './note';
import {format} from 'date-fns';
import SemVer from 'semver/classes/semver';
import {expectNever} from '../util/util';

export const convertToApiNote = (note: Note, fields: Field[]): ApiNote => {
    const {id, content, summary, values} = note;
    const convertedValues = Object.entries(values).reduce(
        (acc, [key, value]) => ({...acc, [key]: convertFieldToApi(fields.find((f) => f.name === key)!, value)}),
        {}
    );
    return {id, content, summary, values: convertedValues};
};
export const convertFieldToApi = (field: Field, value: unknown): string | string[] =>
    field.list ? convertListToApi(field, value as unknown[]) : convertSingleValueToApi(field, value);
export const convertListToApi = (field: Field, value: unknown[]): string | string[] => value.map((v) => convertSingleValueToApi(field, v));
export const convertSingleValueToApi = (field: Field, value: unknown): string => {
    switch (field.type) {
        case 'boolean':
            return (value as boolean).toString();
        case 'date':
            return format(value as Date, 'yyyy-MM-dd');
        case 'number':
            return (value as number).toString();
        case 'semver':
            return (value as SemVer).format();
        case 'string':
        case 'ffversion':
            return value as string;
        default:
            return expectNever(field.type);
    }
};
