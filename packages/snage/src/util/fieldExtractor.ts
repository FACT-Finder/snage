import {Field} from '../config/type';
import {Either, left, right, either} from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import {NoteValues} from '../note/note';
import {stringEncodeHeader} from '../note/convert';

export const extractFieldNamesFromTemplateString = (template: string): string[] => {
    const regex = /\${(\w+)}/g;
    const fields: string[] = [];
    for (let match = regex.exec(template); match; match = regex.exec(template)) {
        fields.push(match[1]);
    }
    return fields;
};

export const getFields = (fields: Field[], fieldNames: string[]): Either<string, Field[]> =>
    A.array.traverse(either)(fieldNames, (name) => getFieldByName(fields, name));

const getFieldByName = (fields: Field[], name: string): Either<string, Field> => {
    const field = fields.find((field) => field.name === name);
    return field ? right(field) : left(`Referenced field '${name}' does not exist.`);
};

export const replacePlaceholders = (fieldValues: NoteValues, fields: Field[], fileNameTemplate: string): string => {
    const stringValues = stringEncodeHeader(fields, fieldValues);
    return fields
        .filter((f) => !f.list)
        .reduce((name, field) => {
            const stringValue = stringValues[field.name];
            if (Array.isArray(stringValue)) {
                throw new Error('Array values may not be used for placeholders');
            }
            return name.replace(`\${${field.name}}`, stringValue);
        }, fileNameTemplate);
};
