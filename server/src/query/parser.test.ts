import {createParser} from './parser';
import semver from 'semver';

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
    test('boolean', () => {
        expect(parser('booleanName = false')).toEqual({status: true, value: {field: 'booleanName', op: '=', value: false}});
        expect(parser('booleanName = xxx')).toEqual({status: false, expected: ["'false'", "'true'"], index: {column: 15, line: 1, offset: 14}});
    });
    test('enum', () => {
        expect(parser('enumName = abc')).toEqual({status: true, value: {field: 'enumName', op: '=', value: 'abc'}});
        expect(parser('enumName = xxx')).toEqual({status: false, expected: ["'abc'", "'cde'"], index: {column: 12, line: 1, offset: 11}});
    });
    test('string', () => {
        expect(parser('stringName = abcde')).toEqual({status: true, value: {field: 'stringName', op: '=', value: 'abcde'}});
        expect(parser('stringName = 555')).toEqual({status: true, value: {field: 'stringName', op: '=', value: '555'}});
        expect(parser('stringName = "multi word"')).toEqual({status: true, value: {field: 'stringName', op: '=', value: 'multi word'}});
    });
    test('number', () => {
        expect(parser('numberName = 5')).toEqual({status: true, value: {field: 'numberName', op: '=', value: 5}});
        expect(parser('numberName = xxx')).toEqual({status: false, expected: ['number'], index: {column: 14, line: 1, offset: 13}});
    });
    test('date', () => {
        expect(parser('dateName >= 2019-01-31')).toEqual({status: true, value: {field: 'dateName', op: '>=', value: 1548892800000}});
        expect(parser('dateName = xxx')).toEqual({status: false, expected: ['date YYYY-MM-DD'], index: {column: 12, line: 1, offset: 11}});
    });
    test('semver', () => {
        expect(parser('semverName >= 1.1.0-100')).toEqual({status: true, value: {field: 'semverName', op: '>=', value: '1.1.0-100'}});
        expect(parser('semverName <= 1.1.0-100')).toEqual({status: true, value: {field: 'semverName', op: '<=', value: '1.1.0-100'}});
        expect(parser('semverName >= 1.1.0-SNAPSHOT')).toEqual({
            status: true,
            value: {field: 'semverName', op: '>=', value: '1.1.0-SNAPSHOT'},
        });
        expect(parser('semverName = aoeuoaeu')).toEqual({status: false, expected: ['semver'], index: {column: 14, line: 1, offset: 13}});
    });
    test('ffversion', () => {
        expect(parser('ffVersionName >= 1.1.0-100')).toEqual({status: true, value: {field: 'ffVersionName', op: '>=', value: '1.1.0-100'}});
        expect(parser('ffVersionName <= 1.1.0-100')).toEqual({status: true, value: {field: 'ffVersionName', op: '<=', value: '1.1.0-100'}});
        expect(parser('ffVersionName >= 1.1.0-SNAPSHOT')).toEqual({
            status: true,
            value: {field: 'ffVersionName', op: '>=', value: '1.1.0-SNAPSHOT'},
        });
        expect(parser('ffVersionName = aoeuoaeu')).toEqual({
            status: false,
            expected: ['ffversion format: 1.0.0-1'],
            index: {column: 17, line: 1, offset: 16},
        });
    });
    test('multiple', () => {
        expect(parser('booleanName = true and enumName = abc')).toEqual({
            status: true,
            value: [{field: 'booleanName', op: '=', value: true}, 'and', {field: 'enumName', op: '=', value: 'abc'}],
        });
        expect(parser('semverName >= 1.1.1 and semverName <= 1.5.5')).toEqual({
            status: true,
            value: [{field: 'semverName', op: '>=', value: '1.1.1'}, 'and', {field: 'semverName', op: '<=', value: '1.5.5'}],
        });
    });
    test('braces', () => {
        expect(parser('booleanName = true or (booleanName = false and stringName = abcde)')).toEqual({
            status: true,
            value: [
                {field: 'booleanName', op: '=', value: true},
                'or',
                [{field: 'booleanName', op: '=', value: false}, 'and', {field: 'stringName', op: '=', value: 'abcde'}],
            ],
        });
        expect(parser('(booleanName = false and stringName = abcde)')).toEqual({
            status: true,
            value: [{field: 'booleanName', op: '=', value: false}, 'and', {field: 'stringName', op: '=', value: 'abcde'}],
        });
        expect(parser('(booleanName = false and stringName = abcde) or booleanName = true')).toEqual({
            status: true,
            value: [
                [{field: 'booleanName', op: '=', value: false}, 'and', {field: 'stringName', op: '=', value: 'abcde'}],
                'or',
                {field: 'booleanName', op: '=', value: true},
            ],
        });
    });
});
