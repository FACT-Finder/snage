import {createParser} from './parser';
import {pipe} from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/lib/Either';
import {createMatcher} from './match';
import {Config} from '../config/type';
import {Note} from '../note/note';

export const filterNotes = (config: Config, condition: string) => (notes: Note[]): E.Either<string, Note[]> => {
    const parser = createParser(config.fields);
    return pipe(
        parser(condition),
        E.bimap(
            (e) => `Invalid expression "${condition}" ${JSON.stringify(e)}`,
            (expression) => notes.filter(createMatcher(expression, config.fields))
        )
    );
};
