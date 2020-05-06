import yargs from 'yargs';
import {DefaultCli, printAndExit} from './common';
import {loadConfig, resolveChangelogDirectory} from '../config/load';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import {parseNotes} from '../note/parser';
import {createParser, Expression} from '../query/parser';
import {createMatcher} from '../query/match';
import {pipe} from 'fp-ts/lib/pipeable';
import {Config} from '../config/type';
import {Note} from '../note/note';

export const find: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'find',
    describe: 'Find notes matching <condition>',
    builder: (y) => y.usage('<condition>'),
    handler: async ({config: configFilePath, _: [, condition]}) => {
        return pipe(
            TE.fromEither(loadConfig(configFilePath)),
            TE.chain((config) =>
                pipe(
                    parseNotes(config, resolveChangelogDirectory(config, configFilePath)),
                    TE.bimap(
                        (errors) => errors.join('\n'),
                        (notes) => [config, notes] as const
                    )
                )
            ),
            TE.chainEitherK(([config, notes]) => {
                const parser = createParser(config.fields);
                return pipe(
                    parser(condition),
                    E.bimap(
                        (e) => `Invalid expression "${condition}" ${JSON.stringify(e)}`,
                        (expression) => [config, notes, expression] as const
                    )
                );
            }),
            TE.map(([config, notes, expression]) => match(config, notes, expression)),
            TE.fold(T.fromIOK(printAndExit), (notes) =>
                T.fromIO<void>(() => {
                    notes.forEach((note) => console.log(note.file));
                })
            )
        )();
    },
};

const match = (config: Config, notes: Note[], expression: Expression): Note[] => {
    const matcher = createMatcher(expression, config.fields);
    return notes.filter((note) => matcher(note.values));
};
