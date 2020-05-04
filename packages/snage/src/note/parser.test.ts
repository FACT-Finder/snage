import {parseFieldValue, parseNote, RawNote} from './parser';
import {left, right} from 'fp-ts/lib/Either';
import semver from 'semver';
import {Field} from '../config/type';
import {Note} from './note';

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
                date: Date.parse('2019-03-03'),
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
            left([
                {file: 'filename', error: 'missingField', field: 'issue'},
                {file: 'filename', error: 'invalidEnum', field: 'type', msg: "expected one of [bugfix, feature, refactoring], got 'bugfixi'"},
            ])
        );
    });
});

describe('parseFieldValue', () => {
    it('throws on missing field', () => {
        expect(parseFieldValue({name: 'issue', type: 'string'}, {})).toStrictEqual(left({error: 'missingField', field: 'issue'}));
    });
    it('parses strings', () => {
        expect(parseFieldValue({name: 'issue', type: 'string'}, {issue: 'XYZ'})).toStrictEqual(right('XYZ'));
        expect(parseFieldValue({name: 'issue', type: 'string'}, {issue: undefined})).toMatchObject(left({error: 'wrongType'}));
        expect(parseFieldValue({name: 'type', type: 'string', enum: ['bug', 'feature']}, {type: 'xxx'})).toStrictEqual(
            left({
                error: 'invalidEnum',
                msg: "expected one of [bug, feature], got 'xxx'",
                field: 'type',
            })
        );
        expect(parseFieldValue({name: 'type', type: 'string', enum: ['bug', 'feature']}, {type: 'bug'})).toStrictEqual(right('bug'));
    });
    it('parses numbers', () => {
        expect(parseFieldValue({name: 'version', type: 'number'}, {version: 50.5})).toStrictEqual(right(50.5));
        expect(parseFieldValue({name: 'version', type: 'number'}, {version: ''})).toMatchObject(left({error: 'wrongType'}));
        expect(parseFieldValue({name: 'version', type: 'number'}, {version: '50'})).toMatchObject(left({error: 'wrongType'}));
        expect(parseFieldValue({name: 'version', type: 'number'}, {version: '50'}, false)).toMatchObject(right(50));
    });
    it('parses booleans', () => {
        expect(parseFieldValue({name: 'released', type: 'boolean'}, {released: true})).toStrictEqual(right(true));
        expect(parseFieldValue({name: 'released', type: 'boolean'}, {released: 'true'})).toMatchObject(left({error: 'wrongType'}));
        expect(parseFieldValue({name: 'released', type: 'boolean'}, {released: 'true'}, false)).toStrictEqual(right(true));
    });
    it('parses date', () => {
        expect(parseFieldValue({name: 'date', type: 'date'}, {date: '2018-01-05'})).toStrictEqual(right(Date.parse('2018-01-05')));
        expect(parseFieldValue({name: 'date', type: 'date'}, {date: undefined})).toMatchObject(left({error: 'wrongType'}));
    });
    it('parses semver', () => {
        expect(parseFieldValue({name: 'version', type: 'semver'}, {version: undefined})).toMatchObject(left({error: 'wrongType'}));
        expect(parseFieldValue({name: 'version', type: 'semver'}, {version: '0.8.5-153'})).toStrictEqual(right(semver.parse('0.8.5-153')));
        expect(parseFieldValue({name: 'version', type: 'semver'}, {version: '0.8'})).toStrictEqual(
            left({
                error: 'invalidSemVer',
                msg: "expected valid semver, got '0.8'",
                field: 'version',
            })
        );
    });
    it('parses ffversion', () => {
        expect(parseFieldValue({name: 'version', type: 'ffversion'}, {version: '0.8.5-153'})).toStrictEqual(right('0.8.5-153'));
        expect(parseFieldValue({name: 'version', type: 'ffversion'}, {version: '0.8'})).toStrictEqual(
            left({
                error: 'invalidFFVersion',
                msg: "expected valid ffversion in format '1.0.0-1', got '0.8'",
                field: 'version',
            })
        );
    });
    it('parses lists', () => {
        expect(parseFieldValue({name: 'text', type: 'string', list: true}, {text: ['x', 'y']})).toStrictEqual(right(['x', 'y']));
        expect(parseFieldValue({name: 'text', type: 'string', list: true}, {text: undefined})).toMatchObject(left({error: 'wrongType'}));
        expect(parseFieldValue({name: 'text', type: 'string', list: true}, {text: ['x', undefined]})).toMatchObject(left({error: 'wrongType'}));
    });
    it('allows to omit optional fields', () => {
        expect(parseFieldValue({name: 'text', type: 'string', optional: true}, {})).toStrictEqual(right(undefined));
    });
});
