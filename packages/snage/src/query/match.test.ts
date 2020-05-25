import {createMatcher, MatcherNote} from './match';
import {createParser} from './parser';
import semver from 'semver/preload';
import {Field} from '../config/type';
import {NoteValues} from '../note/note';
import {fold} from 'fp-ts/lib/Either';
import {pipe} from 'fp-ts/lib/pipeable';
import {LocalDate} from '@js-joda/core';

const fields: Field[] = [
    {
        name: 'booleanName',
        type: 'boolean',
    },
    {
        name: 'enumName',
        enum: ['abc', 'cde'],
        type: 'string',
    },
    {
        name: 'listEnumName',
        enum: ['a', 'b', 'c', 'd'],
        type: 'string',
        list: true,
    },
    {
        name: 'stringName',
        type: 'string',
    },
    {
        name: 'numberName',
        type: 'number',
    },
    {
        name: 'dateName',
        type: 'date',
    },
    {
        name: 'semverName',
        type: 'semver',
    },
    {
        name: 'ffVersion',
        type: 'ffversion',
    },
];

describe('match', () => {
    const parser = createParser(fields);
    const createTest = (expression: string, note: NoteValues, result: boolean): (() => void) =>
        createFullTest(expression, {content: '', summary: '', values: note}, result);
    const createFullTest = (expression: string, note: MatcherNote, result: boolean) => () => {
        test(`${expression} + ${JSON.stringify(note)} => ${result ? 'true' : 'false'}`, () => {
            pipe(
                parser(expression),
                fold(
                    (err) => fail(`illegal expression ${expression} ${JSON.stringify(err)}`),
                    (parsed) => {
                        expect(createMatcher(parsed, fields)(note)).toBe(result);
                    }
                )
            );
        });
    };

    [
        createFullTest('summary = "cool story"', {summary: 'cool story', content: 'irrelevant', values: {}}, true),
        createFullTest('content ~ "ClassCastException"', {summary: 'hello', content: 'my\nClassCastException\nerror', values: {}}, true),
        createFullTest('content ~ "ClassCastExcption"', {summary: 'hello', content: 'my\nClassCastException\nerror', values: {}}, false),

        createTest('booleanName absent', {booleanName: true}, false),
        createTest('booleanName present', {booleanName: true}, true),

        createTest('booleanName absent', {}, true),
        createTest('booleanName present', {}, false),

        createTest('ffVersion absent', {}, true),
        createTest('ffVersion present', {}, false),

        createTest('booleanName = true', {booleanName: true}, true),
        createTest('booleanName = false', {booleanName: true}, false),
        createTest('enumName = abc', {enumName: 'abc'}, true),
        createTest('enumName = abc or enumName = cde', {enumName: 'abc'}, true),
        createTest('enumName = abc and enumName = cde', {enumName: 'abc'}, false),
        createTest('listEnumName = a and listEnumName = b', {listEnumName: ['a', 'b']}, true),

        createTest('numberName >= 5', {numberName: 6}, true),
        createTest('numberName >= 5', {numberName: 5}, true),
        createTest('numberName >= 5', {numberName: 4}, false),

        createTest('numberName > 5', {numberName: 6}, true),
        createTest('numberName > 5', {numberName: 5}, false),

        createTest('numberName < 5', {numberName: 5}, false),
        createTest('numberName < 5', {numberName: 4}, true),

        createTest('numberName = 5', {numberName: 5}, true),
        createTest('numberName = 5', {numberName: 4}, false),

        createTest('numberName != 5', {numberName: 4}, true),
        createTest('numberName != 5', {numberName: 5}, false),

        createTest('numberName <= 5', {numberName: 6}, false),
        createTest('numberName <= 5', {numberName: 5}, true),
        createTest('numberName <= 5', {numberName: 4}, true),

        createTest('stringName ~ world', {stringName: 'hello world'}, true),

        createTest('stringName ~~ "hell world"', {stringName: 'hello world'}, true),
        createTest('stringName ~~ warld', {stringName: 'hello world'}, true),
        createTest('stringName ~~ baum', {stringName: 'hello world'}, false),

        createTest('semverName > 1.1.1', {semverName: semver.parse('2.0.0')!}, true),
        createTest('semverName = 2.0.0', {semverName: semver.parse('2.0.0')!}, true),
        createTest('semverName = 2.0.0', {semverName: semver.parse('2.0.0')!}, true),
        createTest('semverName < 2.0.0', {semverName: semver.parse('2.0.0')!}, false),
        createTest('semverName <= 2.0.0', {semverName: semver.parse('2.0.0')!}, true),
        createTest('semverName <= 2.0', {semverName: semver.parse('2.0.0')!}, true),
        createTest('semverName > 1.1.1', {semverName: semver.parse('2.0.0-1')!}, false), // prerelease
        createTest('semverName > 1', {semverName: semver.parse('2.0.0-1')!}, false), // prerelease
        createTest('semverName > 1', {semverName: semver.parse('2.0.0-beta')!}, false), // prerelease
        createTest('semverName < 1', {semverName: semver.parse('2.0.0-1')!}, false), // prerelease
        createTest('semverName > 1.1.1', {semverName: semver.parse('2.0.0')!}, true),
        createTest('semverName > 1', {semverName: semver.parse('2.0.0')!}, true),
        createTest('semverName = 1', {semverName: semver.parse('1.0.0')!}, true),
        createTest('semverName = 1', {semverName: semver.parse('1.1.0')!}, true),
        createTest('semverName > 1.0', {semverName: semver.parse('1.0.0')!}, false),
        createTest('semverName > 1.0', {semverName: semver.parse('1.0.999999')!}, false),
        createTest('semverName > 1.0', {semverName: semver.parse('1.1.0')!}, true),

        createTest('ffVersion > 1.1.1', {ffVersion: '2.0.0'}, true),
        createTest('ffVersion > 3', {ffVersion: '2.0.0'}, false),
        createTest('ffVersion = 2.0.1', {ffVersion: '2.0.0'}, false),
        createTest('ffVersion = 2.0.0-10', {ffVersion: '2.0.0'}, false),
        createTest('ffVersion > 2.0.0-10', {ffVersion: '2.0.0'}, false),
        createTest('ffVersion < 2.0.0-10', {ffVersion: '2.0.0'}, true),
        createTest('ffVersion > 2.0.0-1', {ffVersion: '2.0.0'}, false),
        createTest('ffVersion = 2', {ffVersion: '2.0.0-13'}, true),
        createTest('ffVersion = 2.0.0-12', {ffVersion: '2.0.0-13'}, false),
        createTest('ffVersion = 2.0.0-13', {ffVersion: '2.0.0-13'}, true),
        createTest('ffVersion < 2.0.0', {ffVersion: '2.0.0'}, false),
        createTest('ffVersion > 2.0.0', {ffVersion: '2.0.0'}, false),
        createTest('ffVersion <= 2.0.0', {ffVersion: '2.0.0'}, true),
        createTest('ffVersion <= 2.0', {ffVersion: '2.0.0'}, true),
        createTest('ffVersion > 1.1.1', {ffVersion: '2.0.0-1'}, true),
        createTest('ffVersion > 2.0.0', {ffVersion: '2.0.0-1'}, false),
        createTest('ffVersion >= 2.0.0', {ffVersion: '2.0.0-1'}, true),
        createTest('ffVersion > 2', {ffVersion: '2.0.0-1'}, false),
        createTest('ffVersion < 1', {ffVersion: '2.0.0-1'}, false),

        createTest('dateName <= 2019-01-31', {dateName: LocalDate.parse('2019-01-31')}, true),
        createTest('dateName < 2019-01-31', {dateName: LocalDate.parse('2019-01-31')}, false),
        createTest('dateName = 2019-01-31', {dateName: LocalDate.parse('2019-01-31')}, true),
        createTest('dateName = 2019-01-31', {dateName: LocalDate.parse('2019-01-30')}, false),

        createTest('booleanName = true or (booleanName = false and stringName = "test")', {booleanName: true, stringName: 'nah'}, true),
        createTest('booleanName = true or (booleanName = false and stringName = "test")', {booleanName: false, stringName: 'nah'}, false),
        createTest('booleanName = true or (booleanName = false and stringName = "test")', {booleanName: false, stringName: 'test'}, true),

        createTest('semverName >= 1.5.0 and semverName <= 2.0.0', {semverName: semver.parse('1.4.0')!}, false),
        createTest('semverName >= 1.5.0 and semverName <= 2.0.0', {semverName: semver.parse('2.1.0')!}, false),
        createTest('semverName >= 1.5.0 and semverName <= 2.0.0', {semverName: semver.parse('1.7.0')!}, true),
    ].forEach((check) => check());
});
