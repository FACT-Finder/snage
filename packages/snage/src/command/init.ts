import yargs from 'yargs';
import {DefaultCli} from './common';

export const init: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'init',
    describe: 'Not implemented yet.',
    handler: () => {
        // TODO https://github.com/FACT-Finder/snage/issues/20 Init the snage config in the current directory.
    },
};
