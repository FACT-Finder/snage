import {FieldValue} from '../config/type';

export interface Note {
    id: string;
    file: string;
    content: string;
    summary: string;

    values: NoteValues;
}
export type NoteValues = Record<string, FieldValue>;
