import {exportToString} from './export';
import {Field} from '../config/type';
import {Note, partialNote} from './note';

const fields: Field[] = [
    {
        name: 'hello',
        type: 'string',
    },
];
const notes: Note[] = [
    partialNote({
        content: 'my content',
        values: {
            hello: 'value',
        },
        file: 'changelog/hello.md',
        summary: 'My headline',
    }),
    partialNote({
        content: '   ',
        values: {
            hello: 'value',
        },
        file: 'changelog/hello.md',
        summary: 'No body',
    }),
];

describe('export', () => {
    test('with tags', () => {
        expect(exportToString(notes, fields, {tags: true})).toMatchInlineSnapshot(`
            "---
            hello: value
            ---
            # My headline

            my content

            ---
            hello: value
            ---
            # No body"
        `);
    });
    test('without tags', () => {
        expect(exportToString(notes, fields, {tags: false})).toMatchInlineSnapshot(`
            "# My headline

            my content

            # No body"
        `);
    });
});
