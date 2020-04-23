import yargs from 'yargs';
import {loadConfig, resolveChangelogDirectory} from '../config/load';
import {parseNotes} from '../note/parser';
import {DefaultCli} from './common';

export const lint: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'lint',
    describe: 'Lint all change log files.',
    handler: ({config: configFilePath}) => {
        const config = loadConfig(configFilePath);
        const changelogDirectory = resolveChangelogDirectory(config, configFilePath);
        parseNotes(config, changelogDirectory);
    },
};
