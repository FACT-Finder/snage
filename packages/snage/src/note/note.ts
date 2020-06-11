import {CSS, FieldValue} from '../config/type';

export interface Note {
    id: string;
    file: string;
    content: string;
    summary: string;
    style: CSS;
    links: NoteLink[];

    values: NoteValues;
}

export const partialNote = (note: Partial<Note>): Note => ({id: '', file: '', content: '', summary: '', style: {}, links: [], values: {}, ...note});

export interface NoteLink {
    label: string;
    href: string;
}
export type NoteValues = Record<string, FieldValue>;
