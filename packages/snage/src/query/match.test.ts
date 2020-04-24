import {createMatcher} from './match';
import {createParser} from './parser';
import {Field, Note} from '../../../shared/type';
import semver from 'semver/preload';

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
    const createTest = (expression: string, note: Omit<Note, 'id'>, result: boolean) => () => {
        test(`${expression} + ${JSON.stringify(note)} => ${result ? 'true' : 'false'}`, () => {
            const exp = parser(expression);
            if (!exp.status) {
                fail('illegal expression ' + expression + ' ' + JSON.stringify(exp));
                return;
            }
            expect(createMatcher(exp.value, fields)({__id: 'nah', __content: 'nah', __summary: 'nah', ...note})).toBe(result);
        });
    };

    [
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

        createTest('semverName > 1.1.1', {semverName: semver.parse('2.0.0')}, true),
        createTest('semverName = 2.0.0', {semverName: semver.parse('2.0.0')}, true),
        createTest('semverName = 2.0.0', {semverName: semver.parse('2.0.0')}, true),
        createTest('semverName < 2.0.0', {semverName: semver.parse('2.0.0')}, false),
        createTest('semverName <= 2.0.0', {semverName: semver.parse('2.0.0')}, true),
        createTest('semverName <= 2.0', {semverName: semver.parse('2.0.0')}, true),
        createTest('semverName > 1.1.1', {semverName: semver.parse('2.0.0-1')}, false), // prerelease
        createTest('semverName > 1', {semverName: semver.parse('2.0.0-1')}, false), // prerelease
        createTest('semverName > 1', {semverName: semver.parse('2.0.0-beta')}, false), // prerelease
        createTest('semverName < 1', {semverName: semver.parse('2.0.0-1')}, false), // prerelease
        createTest('semverName > 1.1.1', {semverName: semver.parse('2.0.0')}, true),
        createTest('semverName > 1', {semverName: semver.parse('2.0.0')}, true),
        createTest('semverName = 1', {semverName: semver.parse('1.0.0')}, true),
        createTest('semverName = 1', {semverName: semver.parse('1.1.0')}, true),
        createTest('semverName > 1.0', {semverName: semver.parse('1.0.0')}, false),
        createTest('semverName > 1.0', {semverName: semver.parse('1.0.999999')}, false),
        createTest('semverName > 1.0', {semverName: semver.parse('1.1.0')}, true),

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

        createTest('dateName <= 2019-01-31', {dateName: Date.parse('2019-01-31')}, true),
        createTest('dateName < 2019-01-31', {dateName: Date.parse('2019-01-31')}, false),
        createTest('dateName = 2019-01-31', {dateName: Date.parse('2019-01-31')}, true),
        createTest('dateName = 2019-01-31', {dateName: Date.parse('2019-01-30')}, false),

        createTest('booleanName = true or (booleanName = false and stringName = "test")', {booleanName: true, stringName: 'nah'}, true),
        createTest('booleanName = true or (booleanName = false and stringName = "test")', {booleanName: false, stringName: 'nah'}, false),
        createTest('booleanName = true or (booleanName = false and stringName = "test")', {booleanName: false, stringName: 'test'}, true),

        createTest('semverName >= 1.5.0 and semverName <= 2.0.0', {semverName: semver.parse('1.4.0')}, false),
        createTest('semverName >= 1.5.0 and semverName <= 2.0.0', {semverName: semver.parse('2.1.0')}, false),
        createTest('semverName >= 1.5.0 and semverName <= 2.0.0', {semverName: semver.parse('1.7.0')}, true),
    ].forEach((check) => check());
});
