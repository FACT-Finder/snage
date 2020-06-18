import {CSS, FieldValue, PrimitiveFieldValue} from '../config/type';

export interface Note {
    id: string;
    file: string;
    content: string;
    summary: string;
    style?: CSS;
    links: NoteLink[];
    valueStyles: Record<string, Record<string, string>>;

    values: NoteValues;
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
    ...note,
});

export interface NoteLink {
    label: string;
    href: string;
}
export type NoteValues = Record<string, FieldValue>;
type PrimitiveYamlFieldValue = string | number | boolean;
export type YamlFieldValue = PrimitiveFieldValue | PrimitiveYamlFieldValue[];
export type YamlNoteValues = Record<string, YamlFieldValue>;
export type StringNoteValues = Record<string, string | string[]>;
