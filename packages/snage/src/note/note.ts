import {CSS, FieldValue} from '../config/type';

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
export type StringNoteValues = Record<string, string | string[]>;
