import {createParser, StatusOP, StatusValue} from './parser';
import {left, right} from 'fp-ts/lib/Either';
import {LocalDate} from '@js-joda/core';

const parser = createParser([
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
        name: 'ffVersionName',
        type: 'ffversion',
    },
]);

describe('parser', () => {
    test('status', () => {
        expect(parser('booleanName absent')).toEqual(
            right({field: 'booleanName', op: StatusOP, value: StatusValue.Absent})
        );
        expect(parser('booleanName present')).toEqual(
            right({field: 'booleanName', op: StatusOP, value: StatusValue.Present})
        );
        expect(parser('booleanName woot')).toEqual(
            left({
                expected: ["'!='", "'='", "'absent'", "'present'"],
                index: {column: 13, line: 1, offset: 12},
            })
        );
        expect(parser('booleanName = xxx')).toEqual(
            left({expected: ["'false'", "'true'"], index: {column: 15, line: 1, offset: 14}})
        );
    });
    test('boolean', () => {
        expect(parser('booleanName = false')).toEqual(right({field: 'booleanName', op: '=', value: false}));
        expect(parser('booleanName = xxx')).toEqual(
            left({expected: ["'false'", "'true'"], index: {column: 15, line: 1, offset: 14}})
        );
    });
    test('enum', () => {
        expect(parser('enumName = abc')).toEqual(right({field: 'enumName', op: '=', value: 'abc'}));
        expect(parser('enumName = xxx')).toEqual(
            left({expected: ["'abc'", "'cde'"], index: {column: 12, line: 1, offset: 11}})
        );
    });
    test('string', () => {
        expect(parser('stringName = abcde')).toEqual(right({field: 'stringName', op: '=', value: 'abcde'}));
        expect(parser('content = abcde')).toEqual(right({field: 'content', op: '=', value: 'abcde'}));
        expect(parser('stringName = ,.><=+\\|!@#$%^&*{}+_-?')).toEqual(
            right({field: 'stringName', op: '=', value: ',.><=+\\|!@#$%^&*{}+_-?'})
        );
        expect(parser('stringName = 555')).toEqual(right({field: 'stringName', op: '=', value: '555'}));
        expect(parser('stringName = "multi word"')).toEqual(right({field: 'stringName', op: '=', value: 'multi word'}));
    });
    test('number', () => {
        expect(parser('numberName = 5')).toEqual(right({field: 'numberName', op: '=', value: 5}));
        expect(parser('numberName = xxx')).toEqual(
            left({expected: ['number'], index: {column: 14, line: 1, offset: 13}})
        );
    });
    test('date', () => {
        expect(parser('dateName >= 2019-01-31')).toEqual(
            right({field: 'dateName', op: '>=', value: LocalDate.of(2019, 1, 31)})
        );
        expect(parser('dateName = xxx')).toEqual(
            left({expected: ['date YYYY-MM-DD'], index: {column: 12, line: 1, offset: 11}})
        );
        expect(parser('dateName >= 2019-02-31')).toMatchObject(left({expected: ['valid date YYYY-MM-DD']}));
    });
    test('semver', () => {
        expect(parser('semverName >= 1.1.0-100')).toEqual(right({field: 'semverName', op: '>=', value: '1.1.0-100'}));
        expect(parser('semverName <= 1.1.0-100')).toEqual(right({field: 'semverName', op: '<=', value: '1.1.0-100'}));
        expect(parser('semverName >= 1.1.0-SNAPSHOT')).toEqual(
            right({field: 'semverName', op: '>=', value: '1.1.0-SNAPSHOT'})
        );
        expect(parser('semverName = aoeuoaeu')).toEqual(
            left({expected: ['semver'], index: {column: 14, line: 1, offset: 13}})
        );
    });
    test('ffversion', () => {
        expect(parser('ffVersionName >= 1.1.0-100')).toEqual(
            right({field: 'ffVersionName', op: '>=', value: '1.1.0-100'})
        );
        expect(parser('ffVersionName <= 1.1.0-100')).toEqual(
            right({field: 'ffVersionName', op: '<=', value: '1.1.0-100'})
        );
        expect(parser('ffVersionName >= 1.1.0-SNAPSHOT')).toEqual(
            right({field: 'ffVersionName', op: '>=', value: '1.1.0-SNAPSHOT'})
        );
        expect(parser('ffVersionName = aoeuoaeu')).toEqual(
            left({
                expected: ['ffversion format: 1.0.0-1'],
                index: {column: 17, line: 1, offset: 16},
            })
        );
    });
    test('multiple', () => {
        expect(parser('booleanName = true and enumName = abc')).toEqual(
            right([{field: 'booleanName', op: '=', value: true}, 'and', {field: 'enumName', op: '=', value: 'abc'}])
        );
        expect(parser('semverName >= 1.1.1 and semverName <= 1.5.5')).toEqual(
            right([
                {field: 'semverName', op: '>=', value: '1.1.1'},
                'and',
                {field: 'semverName', op: '<=', value: '1.5.5'},
            ])
        );
    });
    test('braces', () => {
        expect(parser('booleanName = true or (booleanName = false and stringName = abcde)')).toEqual(
            right([
                {field: 'booleanName', op: '=', value: true},
                'or',
                [{field: 'booleanName', op: '=', value: false}, 'and', {field: 'stringName', op: '=', value: 'abcde'}],
            ])
        );
        expect(parser('(booleanName = false and stringName = abcde)')).toEqual(
            right([
                {field: 'booleanName', op: '=', value: false},
                'and',
                {field: 'stringName', op: '=', value: 'abcde'},
            ])
        );
        expect(parser('(booleanName = false and stringName = abcde) or booleanName = true')).toEqual(
            right([
                [{field: 'booleanName', op: '=', value: false}, 'and', {field: 'stringName', op: '=', value: 'abcde'}],
                'or',
                {field: 'booleanName', op: '=', value: true},
            ])
        );
    });
});
