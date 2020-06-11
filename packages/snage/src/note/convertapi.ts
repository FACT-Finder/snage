import {Field} from '../config/type';
import {ApiNote} from '../../../shared/type';
import {Note} from './note';
import {stringEncodeHeader} from './convert';

export const convertToApiNote = (note: Note, fields: Field[]): ApiNote => {
    const {id, content, summary, values} = note;
    const convertedValues = stringEncodeHeader(fields, values);
    return {id, content, summary, values: convertedValues, links: note.links, style: note.style};
};
