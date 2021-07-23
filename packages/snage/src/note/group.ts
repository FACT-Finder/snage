import {Config} from '../config/type';
import {Note} from './note';
import * as E from 'fp-ts/lib/Either';
import {pipe} from 'fp-ts/lib/pipeable';
import * as A from 'fp-ts/lib/Array';
import {encodeStringValue} from './convert';

export const groupByFieldNameMaybe = (
    config: Config,
    fieldName?: string
): ((notes: Note[]) => E.Either<string, Record<string, Note[]> | Note[]>) => {
    if (fieldName === undefined) {
        return E.right;
    }
    return groupByFieldName(config, fieldName);
};

export const groupByFieldName =
    (config: Config, fieldName: string) =>
    (notes: Note[]): E.Either<string, Record<string, Note[]>> =>
        pipe(
            config.fields,
            A.findFirst(({name}) => name === fieldName),
            E.fromOption(() => `field ${fieldName} does not exist`),
            E.filterOrElse(
                (field) => !field.list,
                () => `field ${fieldName} cannot be grouped because it is type list`
            ),
            E.map((field) =>
                notes.reduce((grouped, note) => {
                    const value = note.values[field.name];
                    const key = value ? encodeStringValue(field.type, field, value).toString() : 'no value';
                    return {...grouped, [key]: [...(grouped[key] ?? []), note]};
                }, {})
            )
        );
