import {parseConfig} from './parser';
import {left, right} from 'fp-ts/lib/Either';

describe('parseConfig', () => {
    it('throws when filename is missing', () => {
        expect(parseConfig({})).toMatchObject(left([{message: "should have required property 'filename'"}]));
    });
    it('parses minimal example', () => {
        const config = {
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
        expect(parseConfig(config)).toStrictEqual(
            right({
                ...config,
                fileTemplateText: '',
                filterPresets: [],
                links: [],
            })
        );
    });
});
