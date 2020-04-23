import {parseField, parseNote} from './parser';
import {Field, Note} from '../../../shared/type';
import {left, right} from 'fp-ts/lib/Either';
import semver from 'semver';

describe('parseNote', () => {
    const fields: Field[] = [
        {name: 'issue', type: 'string'},
        {name: 'type', type: 'string', enum: ['bugfix', 'feature', 'refactoring']},
        {name: 'date', type: 'date'},
    ];

    const mdFile = `---
issue: xyz
type: bugfix
date: "2019-03-03"
---
# test
`;
    it('works', () => {
        const expected: Note = {
            id: '',
            issue: 'xyz',
            type: 'bugfix',
            date: Date.parse('2019-03-03'),
            content: '# test\n',
        };
        expect(parseNote(fields, mdFile)).toStrictEqual(right(expected));
    });
    it('returns first found failure', () => {
        const noIssue = `---
type: bugfix
date: "2019-03-03"
---
# test
`;
        expect(parseNote(fields, noIssue)).toStrictEqual(left({error: 'missingField', field: 'issue'}));
    });
});

describe('parseField', () => {
    it('throws on missing field', () => {
        expect(parseField({name: 'issue', type: 'string'}, {})).toStrictEqual(left({error: 'missingField', field: 'issue'}));
    });
    it('parses strings', () => {
        expect(parseField({name: 'issue', type: 'string'}, {issue: 'XYZ'})).toStrictEqual(right({issue: 'XYZ'}));
        expect(parseField({name: 'issue', type: 'string'}, {issue: undefined})).toMatchObject(left({error: 'wrongType'}));
        expect(parseField({name: 'type', type: 'string', enum: ['bug', 'feature']}, {type: 'xxx'})).toStrictEqual(
            left({
                error: 'invalidEnum',
                msg: "expected one of [bug, feature], got 'xxx'",
                field: 'type',
            })
        );
        expect(parseField({name: 'type', type: 'string', enum: ['bug', 'feature']}, {type: 'bug'})).toStrictEqual(right({type: 'bug'}));
    });
    it('parses numbers', () => {
        expect(parseField({name: 'version', type: 'number'}, {version: 50.5})).toStrictEqual(right({version: 50.5}));
        expect(parseField({name: 'version', type: 'number'}, {version: ''})).toMatchObject(left({error: 'wrongType'}));
    });
    it('parses booleans', () => {
        expect(parseField({name: 'released', type: 'boolean'}, {released: true})).toStrictEqual(right({released: true}));
        expect(parseField({name: 'released', type: 'boolean'}, {released: 'true'})).toMatchObject(left({error: 'wrongType'}));
    });
    it('parses date', () => {
        expect(parseField({name: 'date', type: 'date'}, {date: '2018-01-05'})).toStrictEqual(right({date: Date.parse('2018-01-05')}));
        expect(parseField({name: 'date', type: 'date'}, {date: undefined})).toMatchObject(left({error: 'wrongType'}));
    });
    it('parses semver', () => {
        expect(parseField({name: 'version', type: 'semver'}, {version: undefined})).toMatchObject(left({error: 'wrongType'}));
        expect(parseField({name: 'version', type: 'semver'}, {version: '0.8.5-153'})).toStrictEqual(right({version: semver.parse('0.8.5-153')}));
        expect(parseField({name: 'version', type: 'semver'}, {version: '0.8'})).toStrictEqual(
            left({
                error: 'invalidSemVer',
                msg: "expected valid semver, got '0.8'",
                field: 'version',
            })
        );
    });
    it('parses ffversion', () => {
        expect(parseField({name: 'version', type: 'ffversion'}, {version: '0.8.5-153'})).toStrictEqual(right({version: '0.8.5-153'}));
        expect(parseField({name: 'version', type: 'ffversion'}, {version: '0.8'})).toStrictEqual(
            left({
                error: 'invalidFFVersion',
                msg: "expected valid ffversion in format '1.0.0-1', got '0.8'",
                field: 'version',
            })
        );
    });
    it('parses lists', () => {
        expect(parseField({name: 'text', type: 'string', list: true}, {text: ['x', 'y']})).toStrictEqual(right({text: ['x', 'y']}));
        expect(parseField({name: 'text', type: 'string', list: true}, {text: undefined})).toMatchObject(left({error: 'wrongType'}));
        expect(parseField({name: 'text', type: 'string', list: true}, {text: ['x', undefined]})).toMatchObject(left({error: 'wrongType'}));
    });
    it('allows to omit optional fields', () => {
        expect(parseField({name: 'text', type: 'string', optional: true}, {})).toStrictEqual(right({}));
    });
});
