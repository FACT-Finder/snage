import {parseRawConfig} from './validator';
import {left, right} from 'fp-ts/lib/Either';
import {document} from '../util/yaml';
import {RawConfig} from './type';

describe('parseConfig', () => {
    it('throws when filename is missing', () => {
        expect(parseRawConfig(document({}))).toMatchObject(left("data must have required property 'filename'"));
    });
    const minimal: Partial<RawConfig> = {
        version: 2,
        basedir: '',
        template: {
            file: '',
            text: '',
        },
        fields: [{name: 'version', type: 'semver'}],
        standard: {
            query: '',
            sort: {
                field: 'version',
                order: 'desc',
                absent: 'last',
            },
        },
    };
    it('parses minimal example', () => {
        expect(parseRawConfig(document(minimal))).toStrictEqual(
            right({
                ...minimal,
                filterPresets: [],
                note: {links: [], styles: []},
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
        ).toMatchObject(left('data/fields/0/name must match pattern "^((?!summary|content).+)$"'));
    });
});
