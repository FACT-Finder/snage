import * as E from 'fp-ts/lib/Either';
import {decodeStringValue, decodeValue, encodeHeader} from './convert';
import semver from 'semver/preload';
import {Field} from '../config/type';
import {Note, partialNote} from './note';
import {LocalDate} from '@js-joda/core';

describe('decode', () => {
    test('boolean', () => {
        const field: Field = {name: 'b', type: 'boolean'};
        expect(decodeValue(field, true)).toStrictEqual(E.right(true));
        expect(decodeValue(field, false)).toStrictEqual(E.right(false));
        expect(decodeValue(field, undefined)).toStrictEqual(E.left(['Invalid value undefined supplied to : boolean']));
        expect(decodeValue(field, null)).toStrictEqual(E.left(['Invalid value null supplied to : boolean']));
        expect(decodeValue(field, 5.5)).toStrictEqual(E.left(['Invalid value 5.5 supplied to : boolean']));
    });
    test('stringBoolean', () => {
        const field: Field = {name: 'b', type: 'boolean'};
        expect(decodeStringValue(field, 'TRUE')).toStrictEqual(E.left(['Invalid value "TRUE" supplied to : boolean']));
        expect(decodeStringValue(field, 'true')).toStrictEqual(E.right(true));
        expect(decodeStringValue(field, 'false')).toStrictEqual(E.right(false));
    });
    test('date', () => {
        const field: Field = {name: 'date', type: 'date'};
        expect(decodeValue(field, '1.1.0')).toStrictEqual(E.left(['Invalid value "1.1.0" supplied to : YYYY-MM-DD']));
        expect(decodeValue(field, '2018-05-05')).toStrictEqual(E.right(LocalDate.parse('2018-05-05')));
    });
    test('number', () => {
        const field: Field = {name: 'n', type: 'number'};
        expect(decodeValue(field, '1.1.0')).toStrictEqual(E.left(['Invalid value "1.1.0" supplied to : number']));
        expect(decodeValue(field, 5.5)).toStrictEqual(E.right(5.5));
    });
    test('stringNumber', () => {
        const field: Field = {name: 'number', type: 'number'};
        expect(decodeStringValue(field, 'abc')).toStrictEqual(E.left(['Invalid value "abc" supplied to : number']));
        expect(decodeStringValue(field, '1.5')).toStrictEqual(E.right(1.5));
        expect(decodeStringValue(field, '17')).toStrictEqual(E.right(17));
    });
    test('semver', () => {
        const field: Field = {name: 'version', type: 'semver'};
        expect(decodeValue(field, '1.1')).toStrictEqual(E.left(['Invalid value "1.1" supplied to : semver']));
        expect(decodeValue(field, '1.1.0')).toStrictEqual(E.right(semver.parse('1.1.0')));
    });
    test('ffversion', () => {
        const field: Field = {name: 'version', type: 'ffversion'};
        expect(decodeValue(field, '1.1.0')).toStrictEqual(E.left(['Invalid value "1.1.0" supplied to : ffversion']));
        expect(decodeValue(field, '1.1.0-53')).toStrictEqual(E.right('1.1.0-53'));
    });
    test('string', () => {
        const field: Field = {name: 'issue', type: 'string'};
        expect(decodeValue(field, 'x')).toStrictEqual(E.right('x'));
        expect(decodeValue(field, undefined)).toStrictEqual(E.left(['Invalid value undefined supplied to : string']));
        expect(decodeValue(field, null)).toStrictEqual(E.left(['Invalid value null supplied to : string']));
        expect(decodeValue(field, 5.5)).toStrictEqual(E.left(['Invalid value 5.5 supplied to : string']));
    });
    test('enum', () => {
        const field: Field = {name: 'audience', type: 'string', enum: ['user', 'developer']};
        expect(decodeValue(field, 'x')).toStrictEqual(E.left(['Invalid value "x" supplied to : "user" | "developer"']));
        expect(decodeValue(field, 'user')).toStrictEqual(E.right('user'));
    });
    test('list', () => {
        const field: Field = {name: 'date', type: 'date', list: true};
        expect(decodeValue(field, ['1.1.0'])).toStrictEqual(
            E.left(['Invalid value "1.1.0" supplied to : date/0: YYYY-MM-DD'])
        );
        expect(decodeValue(field, ['2018-05-05', '1.1.0'])).toStrictEqual(
            E.left(['Invalid value "1.1.0" supplied to : date/1: YYYY-MM-DD'])
        );
        expect(decodeValue(field, ['1.1.0', '1.1.1'])).toStrictEqual(
            E.left([
                'Invalid value "1.1.0" supplied to : date/0: YYYY-MM-DD',
                'Invalid value "1.1.1" supplied to : date/1: YYYY-MM-DD',
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
