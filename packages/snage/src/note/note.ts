import {ApiNote} from '../../../shared/type';
import {Field} from '../config/type';
import SemVer from 'semver/classes/semver';
import {format} from 'date-fns';
import {expectNever} from '../util/util';

export interface Note {
    id: string;
    content: string;
    summary: string;

    values: NoteValues;
}
export type NoteValues = Record<string, unknown>;

export const convertToApiNote = (note: Note, fields: Field[]): ApiNote => {
    const {values} = note;
    const convertedValues = Object.entries(values).reduce(
        (acc, [key, value]) => ({...acc, [key]: convertField(fields.find((f) => f.name === key)!, value)}),
        {}
    );
    return {...note, values: convertedValues};
};

export const convertField = (field: Field, value: unknown): string | string[] => {
    if (field.list === true) {
        return convertList(field, value as unknown[]);
    }
    return convertSingleValue(field, value);
};

export const convertList = (field: Field, value: unknown[]): string | string[] => {
    return value.map((v) => convertSingleValue(field, v));
};

export const convertSingleValue = (field: Field, value: unknown): string => {
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
