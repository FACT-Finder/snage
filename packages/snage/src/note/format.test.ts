import {checkFormat, formatNote} from './format';
import {partialNote} from './note';
import * as E from 'fp-ts/lib/Either';
import {PrettierConfig} from '../config/type';
import {assertRight} from '../fp/fp';

const narrowCheck = (value: Array<[PrettierConfig, string, boolean]>): Array<[PrettierConfig, string, boolean]> =>
    value;
const narrowFormat = (value: Array<[PrettierConfig, string, string]>): Array<[PrettierConfig, string, string]> => value;

describe('format', () => {
    test.each(
        narrowCheck([
            [{enabled: false, config: {}}, 'hello\n\n\n\nworld!', true],
            [{enabled: true, config: {}}, 'hello\n\n\n\nworld!\n', false],
            [{enabled: true, config: {}}, 'hello\n\nworld!\n', true],
        ])
    )('%s %s %s', (config, content, expected) => {
        const actual = checkFormat(config, partialNote({content, file: 'some.md'}));
        return expect(E.isRight(actual)).toEqual(expected);
    });
    test.each(
        narrowFormat([
            [{enabled: false, config: {}}, 'hello\n\n\n\nworld!', 'hello\n\n\n\nworld!'],
            [{enabled: true, config: {}}, 'hello\n\n\n\nworld!', 'hello\n\nworld!\n'],
        ])
    )('%s %s %s', (config, content, expected) => {
        const actual = formatNote(config, partialNote({content, file: 'some.md'}));
        assertRight(actual);
        return expect(actual.right.content).toEqual(expected);
    });
});
