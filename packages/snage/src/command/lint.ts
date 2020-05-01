import yargs from 'yargs';
import {loadConfig, resolveChangelogDirectory} from '../config/load';
import {errorToString, parseNotes} from '../note/parser';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import {DefaultCli, printAndExit} from './common';
import {pipe} from 'fp-ts/lib/pipeable';

export const lint: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'lint',
    describe: 'Lint all change log files.',
    handler: async ({config: configFilePath}) => {
        return pipe(
            TE.fromEither(loadConfig(configFilePath)),
            TE.chain((config) => pipe(parseNotes(config, resolveChangelogDirectory(config, configFilePath)), TE.mapLeft(errorToString))),
            TE.fold(T.fromIOK(printAndExit), () => T.fromIO(() => console.log('All good :D')))
        )();
    },
};
