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

const groupedNotes: Record<string, Note[]> = {
    first: [
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
    ],
    second: [
        partialNote({
            content: 'is this library?',
            values: {
                hello: 'other',
            },
            file: 'changelog/hello.md',
            summary: 'cool second',
        }),
    ],
};

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
    describe('grouped', () => {
        test('with tags', () => {
            expect(exportToString(groupedNotes, fields, {tags: true})).toMatchInlineSnapshot(`
                "##############################
                #
                # first
                #
                ##############################

                ---
                hello: value
                ---
                # My headline

                my content

                ---
                hello: value
                ---
                # No body

                ##############################
                #
                # second
                #
                ##############################

                ---
                hello: other
                ---
                # cool second

                is this library?"
            `);
        });
        test('without tags', () => {
            expect(exportToString(groupedNotes, fields, {tags: false})).toMatchInlineSnapshot(`
                "##############################
                #
                # first
                #
                ##############################

                # My headline

                my content

                # No body

                ##############################
                #
                # second
                #
                ##############################

                # cool second

                is this library?"
            `);
        });
    });
});
