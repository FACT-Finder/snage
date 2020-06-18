import {NoteValues} from './note';
import {Field} from '../config/type';
import {YamlStringBuilder} from '../util/yamlStringBuilder';

export const toYamlString = (fieldValues: NoteValues, fields: Field[], fileText: string): string =>
    fields
        .reduce((builder, field) => {
            if (fieldValues[field.name] !== null && fieldValues[field.name] !== undefined) {
                return builder.appendYamlPair(field.name, fieldValues[field.name]);
            } else {
                return field.optional ? builder : builder.appendYamlComment(field.name);
            }
        }, new YamlStringBuilder())
        .appendContent(fileText)
        .build();
