import {parseNote, parseRawNote, RawNote} from './parser';
import {left, right} from 'fp-ts/lib/Either';
import {Field, RawProvidedField} from '../config/type';
import * as semver from 'semver';
import {Note} from './note';
import parseISO from 'date-fns/parseISO';
import * as git from '../provider/git-version';
import {assertRight} from '../fp/fp';
import path from 'path';

describe('parseNote', () => {
    const fields: Field[] = [
        {name: 'issue', type: 'string'},
        {name: 'type', type: 'string', enum: ['bugfix', 'feature', 'refactoring']},
        {name: 'date', type: 'date'},
        {name: 'optional', type: 'string', optional: true},
    ];

    it('works', async () => {
        const rawNote: RawNote = {
            file: 'filename',
            header: {
                issue: 'xyz',
                type: 'bugfix',
                date: '2019-03-03',
            },
            summary: '# cool summary line',
            content: 'body text\n\n**test**\n',
        };

        const expected: Note = {
            id: 'filename',
            summary: 'cool summary line',
            content: 'body text\n\n**test**\n',
            file: 'filename',
            values: {
                issue: 'xyz',
                type: 'bugfix',
                date: parseISO('2019-03-03').getTime(),
            },
        };
        expect(await parseNote(fields, rawNote)()).toStrictEqual(right(expected));
    });
    it('returns all errors', async () => {
        const noIssue: RawNote = {
            file: 'filename',
            header: {
                type: 'bugfixi',
                date: '2019-03-03',
            },
            summary: '# test',
            content: '',
        };
        expect(await parseNote(fields, noIssue)()).toStrictEqual(
            left(['filename: Invalid value "bugfixi" supplied to : note/type: "bugfix" | "feature" | "refactoring"'])
        );
    });
    it('checks for required fields', async () => {
        const noIssue: RawNote = {
            file: 'filename',
            header: {
                date: '2019-03-03',
            },
            summary: '# test',
            content: '',
        };
        expect(await parseNote(fields, noIssue)()).toStrictEqual(
            left(['filename: Missing value for required field issue', 'filename: Missing value for required field type'])
        );
    });
    it('runs providers', async () => {
        const providedField: RawProvidedField = {
            name: 'version',
            type: 'semver',
            provided: {by: 'git-version', arguments: {'version-regex': '^v(.*)$'}},
        };

        const gitProvider = git.providerFactory(providedField);
        assertRight(gitProvider);

        const fields: Field[] = [{name: 'version', type: 'semver', provider: gitProvider.right}];
        const changelogFile = path.resolve(path.join(__dirname, '../../../../changelog/7-config.md'));
        const noIssue: RawNote = {
            file: changelogFile,
            header: {},
            summary: '# test',
            content: '',
        };
        expect(await parseNote(fields, noIssue)()).toMatchObject(
            right({
                values: {
                    version: semver.parse('0.0.2'),
                },
            })
        );
    });
});
describe('parseRawNote', () => {
    it('parses date strings as strings', () => {
        const note = `---
date: 2020-05-20
---
# summary

content
`;
        expect(parseRawNote(note, 'file')).toStrictEqual({
            file: 'file',
            header: {
                date: '2020-05-20',
            },
            summary: '# summary',
            content: 'content\n',
        });
    });
});
