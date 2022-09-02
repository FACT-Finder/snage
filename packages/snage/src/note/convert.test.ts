import * as E from 'fp-ts/lib/Either';
import {decodeStringValue, decodeValue, encodeHeader} from './convert';
import semver from 'semver/preload';
import {Field} from '../config/type';
import {Note, partialNote} from './note';
import {LocalDate} from '@js-joda/core';
import {extractLeft, extractRight} from '../fp/fp';

describe('decode', () => {
    test('boolean', () => {
        const field: Field = {name: 'b', type: 'boolean'};
        expect(decodeValue(field, true)).toStrictEqual(E.right(true));
        expect(decodeValue(field, false)).toStrictEqual(E.right(false));
        expect(decodeValue(field, undefined)).toStrictEqual(E.left(['invalid value undefined, expected boolean']));
        expect(decodeValue(field, null)).toStrictEqual(E.left(['invalid value null, expected boolean']));
        expect(decodeValue(field, 5.5)).toStrictEqual(E.left(['invalid value 5.5, expected boolean']));
    });
    test('stringBoolean', () => {
        const field: Field = {name: 'b', type: 'boolean'};
        expect(decodeStringValue(field, 'TRUE')).toStrictEqual(E.left(['invalid value "TRUE", expected boolean']));
        expect(decodeStringValue(field, 'true')).toStrictEqual(E.right(true));
        expect(decodeStringValue(field, 'false')).toStrictEqual(E.right(false));
    });
    test('date', () => {
        const field: Field = {name: 'date', type: 'date'};
        expect(decodeValue(field, '1.1.0')).toStrictEqual(E.left(['invalid value "1.1.0", expected date(YYYY-MM-DD)']));
        expect(decodeValue(field, '2018-05-05')).toStrictEqual(E.right(LocalDate.parse('2018-05-05')));
    });
    test('number', () => {
        const field: Field = {name: 'n', type: 'number'};
        expect(decodeValue(field, '1.1.0')).toStrictEqual(E.left(['invalid value "1.1.0", expected number']));
        expect(decodeValue(field, 5.5)).toStrictEqual(E.right(5.5));
    });
    test('stringNumber', () => {
        const field: Field = {name: 'number', type: 'number'};
        expect(decodeStringValue(field, 'abc')).toStrictEqual(E.left(['invalid value "abc", expected number']));
        expect(decodeStringValue(field, '1.5')).toStrictEqual(E.right(1.5));
        expect(decodeStringValue(field, '17')).toStrictEqual(E.right(17));
    });
    test('semver', () => {
        const field: Field = {name: 'version', type: 'semver'};
        expect(extractLeft(decodeValue(field, '1.1'))).toMatchInlineSnapshot(`
            [
              "invalid value "1.1", expected semver(major.minor.patch[-prerelease])",
            ]
        `);
        expect(extractRight(decodeValue(field, '1.1.0'))).toStrictEqual(semver.parse('1.1.0'));
    });
    test('ffversion', () => {
        const field: Field = {name: 'version', type: 'ffversion'};
        expect(extractLeft(decodeValue(field, '1.1'))).toMatchInlineSnapshot(`
            [
              "invalid value "1.1", expected ffversion(marketing.major.minor[-patch])",
            ]
        `);
        expect(extractRight(decodeValue(field, '1.1.0'))).toMatchInlineSnapshot(`"1.1.0"`);
        expect(extractRight(decodeValue(field, '1.1.0-53'))).toMatchInlineSnapshot(`"1.1.0-53"`);
    });
    test('string', () => {
        const field: Field = {name: 'issue', type: 'string'};
        expect(decodeValue(field, 'x')).toStrictEqual(E.right('x'));
        expect(decodeValue(field, undefined)).toStrictEqual(E.left(['invalid value undefined, expected string']));
        expect(decodeValue(field, null)).toStrictEqual(E.left(['invalid value null, expected string']));
        expect(decodeValue(field, 5.5)).toStrictEqual(E.left(['invalid value 5.5, expected string']));
    });
    test('enum', () => {
        const field: Field = {name: 'audience', type: 'string', enum: ['user', 'developer']};
        expect(decodeValue(field, 'x')).toStrictEqual(E.left(['invalid value "x", expected "user" | "developer"']));
        expect(decodeValue(field, 'user')).toStrictEqual(E.right('user'));
    });
    test('list', () => {
        const field: Field = {name: 'date', type: 'date', list: true};
        expect(decodeValue(field, ['1.1.0'])).toStrictEqual(
            E.left(['invalid value "1.1.0", expected date(YYYY-MM-DD)'])
        );
        expect(decodeValue(field, ['2018-05-05', '1.1.0'])).toStrictEqual(
            E.left(['invalid value "1.1.0", expected date(YYYY-MM-DD)'])
        );
        expect(decodeValue(field, ['1.1.0', '1.1.1'])).toStrictEqual(
            E.left([
                'invalid value "1.1.0", expected date(YYYY-MM-DD)',
                'invalid value "1.1.1", expected date(YYYY-MM-DD)',
            ])
        );
        expect(decodeValue(field, ['2018-05-05'])).toStrictEqual(E.right([LocalDate.parse('2018-05-05')]));
    });
});
describe('encodeHeader', () => {
    const note: Note = partialNote({
        values: {
            version: semver.parse('1.0.5')!,
            ffversion: '1.0.5-15',
            date: LocalDate.parse('2020-04-24'),
            bool: true,
            number: 1.53,
            list: [true, false],
        },
    });
    const fields: Field[] = [
        {name: 'version', type: 'semver'},
        {name: 'ffversion', type: 'ffversion'},
        {name: 'date', type: 'date'},
        {name: 'bool', type: 'boolean'},
        {name: 'number', type: 'number'},
        {name: 'list', type: 'boolean', list: true},
    ];
    it('yaml converts whole note values', () => {
        expect(encodeHeader(fields, note.values)).toStrictEqual({
            version: '1.0.5',
            ffversion: '1.0.5-15',
            date: '2020-04-24',
            bool: true,
            number: 1.53,
            list: [true, false],
        });
    });
});
