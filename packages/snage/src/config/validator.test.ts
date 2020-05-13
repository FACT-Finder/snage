import {validateConfig} from './validator';
import {left, right} from 'fp-ts/lib/Either';

describe('parseConfig', () => {
    it('throws when filename is missing', () => {
        expect(validateConfig({})).toMatchObject(left({schemaErrors: [{message: "should have required property 'filename'"}]}));
    });
    const minimal = {
        filename: '',
        fields: [{name: 'version', type: 'semver'}],
        standard: {
            query: '',
            sort: {
                field: 'version',
                order: 'desc',
            },
        },
    };
    it('parses minimal example', () => {
        expect(validateConfig(minimal)).toStrictEqual(
            right({
                ...minimal,
                fileTemplateText: '',
                filterPresets: [],
                links: [],
            })
        );
    });
    it('fails on not existing fields in fieldName', () => {
        const config = {
            filename: '${banana}.md',
            fields: [{name: 'version', type: 'semver'}],
            standard: {
                query: '',
                sort: {
                    field: 'version',
                    order: 'desc',
                },
            },
        };
        expect(validateConfig(config)).toMatchObject(left({msg: "error in filename: Referenced field 'banana' does not exist."}));
    });
    it('fails on optional field in fieldName', () => {
        const config = {
            filename: '${likesBanana}.md',
            fields: [
                {name: 'version', type: 'semver'},
                {name: 'likesBanana', type: 'boolean', optional: true},
            ],
            standard: {
                query: '',
                sort: {
                    field: 'version',
                    order: 'desc',
                },
            },
        };
        expect(validateConfig(config)).toMatchObject(
            left({msg: "error in filename: Referenced field 'likesBanana' is optional. Only required fields may be used."})
        );
    });
    it('fails on list field in fieldName', () => {
        const config = {
            filename: '${bananaBrands}.md',
            fields: [
                {name: 'version', type: 'semver'},
                {name: 'bananaBrands', type: 'string', list: true},
            ],
            standard: {
                query: '',
                sort: {
                    field: 'version',
                    order: 'desc',
                },
            },
        };
        expect(validateConfig(config)).toMatchObject(
            left({msg: "error in filename: Referenced field 'bananaBrands' is a list type. Only non list types may be used."})
        );
    });
    it('throws on blacklisted fieldname', () => {
        expect(
            validateConfig({
                ...minimal,
                fields: [{name: 'summary', type: 'boolean'}],
            })
        ).toMatchObject(left({schemaErrors: [{message: 'should match pattern "^((?!summary|content).+)$"'}]}));
    });
});
