import yargs from 'yargs';
import {getConfigFile, parseYAMLDocument} from '../config/load';
import * as E from 'fp-ts/lib/Either';
import {DefaultCli, printAndExit} from './common';
import {pipe} from 'fp-ts/lib/function';
import {migrateConfig} from '../config/validator';
import fs from 'fs';

export const migrate: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'migrate',
    describe: 'Migrate the snage configuration to the current version.',
    builder: (y) => y.example('$0', 'migrate'),
    handler: () => {
        const configFile = pipe(
            getConfigFile(),
            E.getOrElse((error): string => printAndExit(error)())
        );
        return pipe(
            parseYAMLDocument(configFile),
            E.chain(migrateConfig),
            E.chain((migrated) =>
                E.tryCatch(
                    () => fs.writeFileSync(configFile, migrated.toString()),
                    (error) => `Could not write to ${configFile}: ${error}`
                )
            ),
            E.fold(
                (error) => printAndExit(error)(),
                () => console.log(`Migrated ${configFile}.`)
            )
        );
    },
};
