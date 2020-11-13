import {YamlNoteValues} from './note';
import {Field} from '../config/type';
import YAML from 'yaml';
import {YamlStringBuilder} from '../util/yamlStringBuilder';

export const toYamlString = (fieldValues: YamlNoteValues, fields: Field[], fileText: string): string =>
    fields
        .reduce((builder, field) => {
            if (fieldValues[field.name] !== null && fieldValues[field.name] !== undefined) {
                return builder.appendYamlPair(field.name, fieldValues[field.name]);
            } else {
                return field.optional ? builder : builder.appendYamlComment(field.name);
            }
        }, new YamlStringBuilder())
        .appendContent(`\n${fileText}`)
        .build();

export const toYamlFromDocument = (document: YAML.Document, fileText: string): string =>
    `---
${document.toString()}---

${fileText}`;

export const summaryWithContent = (summary: string, content: string): string => {
    const body = content.trim() === '' ? '' : '\n\n' + content.trim();
    return '# ' + summary.trim() + body + '\n';
};
