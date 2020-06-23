import {toYamlString} from './tostring';
import {encodeHeader} from './convert';
import {Note} from './note';
import {Field} from '../config/type';

export interface ExportOptions {
    tags: boolean;
}

export const exportToString = (notes: Note[], fields: Field[], {tags}: ExportOptions): string =>
    notes
        .map((note) => {
            const content = note.content.trim() === '' ? '' : '\n\n' + note.content.trim();
            const summaryWithContent = '# ' + note.summary.trim() + content;
            if (tags) {
                return toYamlString(encodeHeader(fields, note.values), fields, summaryWithContent).trim();
            }
            return summaryWithContent;
        })
        .join('\n\n');
