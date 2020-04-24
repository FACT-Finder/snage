import yargs from 'yargs';
import {DefaultCli} from './common';
import {loadConfigOrExit, resolveChangelogDirectory} from '../config/load';
import {parseNotes} from '../note/parser';
import {createParser} from '../query/parser';
import {createMatcher} from '../query/match';

export const find: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'find',
    describe: 'Find notes matching <condition>',
    builder: (y) => y.usage('<condition>'),
    handler: ({config: configFilePath, _: [, condition]}) => {
        const config = loadConfigOrExit(configFilePath);

        const changelogDirectory = resolveChangelogDirectory(config, configFilePath);
        const notes = parseNotes(config, changelogDirectory);
        const expression = createParser(config.fields)(condition);
        if (!expression.status) {
            console.error(`Invalid expression "${condition}" ${JSON.stringify(expression)}`);
            process.exit(1);
        }

        const matcher = createMatcher(expression.value, config.fields);
        notes.filter((note) => matcher(note.values)).forEach((note) => console.log(note.file));
    },
};
