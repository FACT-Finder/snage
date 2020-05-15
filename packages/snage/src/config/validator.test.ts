import {parseRawConfig} from './validator';
import {left, right} from 'fp-ts/lib/Either';
import {document} from '../util/yaml';

describe('parseConfig', () => {
    it('throws when filename is missing', () => {
        expect(parseRawConfig(document({}))).toMatchObject(left("data should have required property 'filename'"));
    });
    const minimal = {
        version: 1,
        note: {
            basedir: '',
            file: '',
        },
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
        expect(parseRawConfig(document(minimal))).toStrictEqual(
            right({
                ...minimal,
                fileTemplateText: '',
                filterPresets: [],
                links: [],
            })
        );
    });
    it('throws on blacklisted fieldname', () => {
        expect(
            parseRawConfig(
                document({
                    ...minimal,
                    fields: [{name: 'summary', type: 'boolean'}],
                })
            )
        ).toMatchObject(left('data.fields[0].name should match pattern "^((?!summary|content).+)$"'));
    });
});
