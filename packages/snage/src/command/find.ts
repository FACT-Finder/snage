import yargs from 'yargs';
import {DefaultCli, printAndExit} from './common';
import {loadConfig, resolveChangelogDirectory} from '../config/load';
import * as E from 'fp-ts/lib/Either';
import {errorToString, parseNotes} from '../note/parser';
import {createParser} from '../query/parser';
import {createMatcher} from '../query/match';
import {pipe} from 'fp-ts/lib/pipeable';

export const find: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'find',
    describe: 'Find notes matching <condition>',
    builder: (y) => y.usage('<condition>'),
    handler: ({config: configFilePath, _: [, condition]}) => {
        pipe(
            loadConfig(configFilePath),
            E.chain((config) =>
                pipe(
                    parseNotes(config, resolveChangelogDirectory(config, configFilePath)),
                    E.bimap(errorToString, (notes) => [config, notes] as const)
                )
            ),
            E.chain(([config, notes]) => {
                const parser = createParser(config.fields);
                return pipe(
                    parser(condition),
                    E.bimap(
                        (e) => `Invalid expression "${condition}" ${JSON.stringify(e)}`,
                        (expression) => [config, notes, expression] as const
                    )
                );
            }),
            E.fold(printAndExit, ([config, notes, expression]) => {
                const matcher = createMatcher(expression, config.fields);
                notes.filter((note) => matcher(note.values)).forEach((note) => console.log(note.file));
            })
        );
    },
};
