import {left} from 'fp-ts/lib/Either';
import {parseConfig} from './load';

describe('parseConfig', () => {
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
        expect(parseConfig('.snage.yaml', config)).toMatchObject(left("error in note.file: Referenced field 'banana' does not exist."));
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
        expect(parseConfig('.snage.yaml', config)).toMatchObject(
            left("error in note.file: Referenced field 'likesBanana' is optional. Only required fields may be used.")
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
        expect(parseConfig('.snage.yaml', config)).toMatchObject(
            left("error in note.file: Referenced field 'bananaBrands' is a list type. Only non list types may be used.")
        );
    });
});
