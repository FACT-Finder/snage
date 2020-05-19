import {FieldValue} from '../config/type';

export interface Note {
    id: string;
    file: string;
    content: string;
    summary: string;
    links: NoteLink[];

    values: NoteValues;
}
export interface NoteLink {
    label: string;
    href: string;
}
export type NoteValues = Record<string, FieldValue>;
