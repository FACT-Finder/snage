import yargs from 'yargs';
import {loadConfig, resolveChangelogDirectory} from '../config/load';
import {errorToString, parseNotes} from '../note/parser';
import * as E from 'fp-ts/lib/Either';
import {DefaultCli, printAndExit} from './common';
import {pipe} from 'fp-ts/lib/pipeable';

export const lint: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'lint',
    describe: 'Lint all change log files.',
    handler: ({config: configFilePath}) => {
        pipe(
            loadConfig(configFilePath),
            E.chain((config) => pipe(parseNotes(config, resolveChangelogDirectory(config, configFilePath)), E.mapLeft(errorToString))),
            E.fold(printAndExit, () => console.log('All good :D'))
        );
    },
};
