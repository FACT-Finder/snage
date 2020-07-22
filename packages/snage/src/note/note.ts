import {CSS, FieldValue, PrimitiveFieldValue} from '../config/type';
import YAML from 'yaml';

export interface Note {
    id: string;
    file: string;
    content: string;
    summary: string;
    style?: CSS;
    links: NoteLink[];
    valueStyles: Record<string, Record<string, string>>;

    values: NoteValues;
    valuesDocument: YAML.Document;
}

export const partialNote = (note: Partial<Note>): Note => ({
    id: '',
    file: '',
    content: '',
    summary: '',
    style: {},
    links: [],
    values: {},
    valueStyles: {},
    valuesDocument: YAML.parseDocument(YAML.stringify(note.values ?? {})),
    ...note,
});

export const EmptyDocument = YAML.parseDocument('');

export interface NoteLink {
    label: string;
    href: string;
}
export type NoteValues = Record<string, FieldValue>;
type PrimitiveYamlFieldValue = string | number | boolean;
export type YamlFieldValue = PrimitiveFieldValue | PrimitiveYamlFieldValue[];
export type YamlNoteValues = Record<string, YamlFieldValue>;
export type StringNoteValues = Record<string, string | string[]>;
