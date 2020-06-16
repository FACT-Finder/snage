import yargs from 'yargs';
import {DefaultCli, print, printAndExit} from './common';
import {isLeft} from 'fp-ts/lib/Either';
import {addToYargs, handleFieldValues} from '../create/consoleParamsReader';
import {generateChangeLogFile} from '../create/changelogFileWriter';
import {getConfig, getConfigOrExit} from '../config/load';
import {extractFieldNamesFromTemplateString, getFields} from '../util/fieldExtractor';
import {pipe} from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import {identity} from 'fp-ts/lib/function';
import {openInEditor} from '../fp/fp';

export const create: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'create',
    describe: 'Create a note.',
    builder: (y) => {
        y.example('$0', 'create');
        y.example('$0', 'create --no-interactive --issue 12345');
        y.boolean('editor')
            .describe('editor', 'Open the created note inside your $EDITOR.')
            .default('editor', true);
        const config = getConfig();
        if (isLeft(config)) {
            y.epilog(config.left);
            return y;
        }
        return addToYargs(y, config.right) as yargs.Argv<DefaultCli>;
    },
    handler: async (args) => {
        const {editor} = args;
        const config = getConfigOrExit();
        const fieldsForFileName = getFields(config.fields, extractFieldNamesFromTemplateString(config.template.file));
        if (isLeft(fieldsForFileName)) {
            console.error(fieldsForFileName.left);
            process.exit(1);
        }

        return pipe(
            handleFieldValues(config.fields, args),
            TE.mapLeft((e) => e.join('\n')),
            TE.chainEitherK((fieldValues) => generateChangeLogFile(fieldValues, config, fieldsForFileName.right)),
            editor ? TE.chain(openInEditor) : identity,
            TE.fold(T.fromIOK(printAndExit), T.fromIOK(print))
        )();
    },
};
