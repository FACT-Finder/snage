import {left} from 'fp-ts/lib/Either';
import {parseConfig} from './load';
import semver from 'semver';
import {assertRight} from '../fp/fp';
import {document} from '../util/yaml';

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
        expect(parseConfig('.snage.yaml', document(config))).toMatchObject(left("error in note.file: Referenced field 'banana' does not exist."));
    });
    it('fails on not existing fields in link', () => {
        const config = {
            filename: '${version}.md',
            links: [{name: 'Version ${banana}', link: 'http://github.com'}],
            fields: [{name: 'version', type: 'semver'}],
            standard: {
                query: '',
                sort: {
                    field: 'version',
                    order: 'desc',
                },
            },
        };
        expect(parseConfig('.snage.yaml', document(config))).toMatchObject(left("error in links/0: Referenced field 'banana' does not exist."));
    });
    it('creates link provider', () => {
        const config = {
            filename: '${name}.md',
            links: [{name: 'Name ${name} ${version}', link: 'http://github.com'}],
            fields: [
                {name: 'name', type: 'string'},
                {name: 'version', type: 'semver'},
            ],
            standard: {
                query: '',
                sort: {
                    field: 'version',
                    order: 'desc',
                },
            },
        };
        const conf = parseConfig('.snage.yaml', document(config));
        assertRight(conf);
        const links = conf.right.note.links({version: semver.parse('1.0.0')!, name: 'hello'});
        expect(links).toEqual([{label: 'Name hello 1.0.0', href: 'http://github.com'}]);
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
        expect(parseConfig('.snage.yaml', document(config))).toMatchObject(
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
        expect(parseConfig('.snage.yaml', document(config))).toMatchObject(
            left("error in note.file: Referenced field 'bananaBrands' is a list type. Only non list types may be used.")
        );
    });
});
