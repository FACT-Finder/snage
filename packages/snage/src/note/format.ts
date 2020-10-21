import {Note} from './note';
import prettier from 'prettier';
import * as E from 'fp-ts/lib/Either';
import {PrettierConfig} from '../config/type';
import {sequenceKeepAllLefts} from '../fp/fp';

export const formatNote = ({enabled, config}: PrettierConfig, note: Note): E.Either<string, Note> => {
    try {
        if (!enabled) {
            return E.right(note);
        }
        return E.right({
            ...note,
            content: prettier.format(note.content, {...config, filepath: note.file}),
        });
    } catch (e) {
        return E.left(`${note.file}: format error ${e}`);
    }
};

export const checkFormat = ({enabled, config}: PrettierConfig, note: Note): E.Either<string, Note> => {
    try {
        if (!enabled || prettier.check(note.content, {...config, filepath: note.file})) {
            return E.right(note);
        }
        return E.left(`${note.file}: not formatted. Run 'snage lint --fix'`);
    } catch (e) {
        return E.left(`${note.file}: error ${e}`);
    }
};

export const checkFormatMultiple = (config: PrettierConfig, note: Note[]): E.Either<string[], Note[]> =>
    sequenceKeepAllLefts(note.map((note) => checkFormat(config, note)));
