import {toYamlString} from './tostring';
import {encodeHeader} from './convert';
import {Note} from './note';
import {Field} from '../config/type';
import * as R from 'fp-ts/lib/Record';

export interface ExportOptions {
    tags: boolean;
}

export const exportToString = (
    notes: Note[] | Record<string, Note[]>,
    fields: Field[],
    {tags}: ExportOptions
): string => {
    if (Array.isArray(notes)) {
        return exportNotes(notes, fields, {tags});
    }
    return R.toArray(notes)
        .map(([key, notes]) => title(key) + '\n\n' + exportNotes(notes, fields, {tags}))
        .join('\n\n');
};

const title = (value: string): string => `\
${'#'.repeat(30)}
#
# ${value ? value : '-- no value --'}
#
${'#'.repeat(30)}`;

const exportNotes = (notes: Note[], fields: Field[], {tags}: {tags: boolean}): string =>
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
