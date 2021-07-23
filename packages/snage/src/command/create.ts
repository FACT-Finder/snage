import yargs from 'yargs';
import {DefaultCli, print, printAndExit} from './common';
import {getConfig, getConfigOrExit} from '../config/load';
import {replacePlaceholders} from '../util/fieldExtractor';
import {pipe} from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import * as T from 'fp-ts/lib/Task';
import {identity} from 'fp-ts/lib/function';
import {createDirectoryOfFile, openInEditor, toRecord, writeFile, findUnusedFile} from '../fp/fp';
import * as A from 'fp-ts/lib/Array';
import {decodeStringHeader, encodeHeader} from '../note/convert';
import {StringNoteValues} from '../note/note';
import {toYamlString} from '../note/tostring';
import path from 'path';
import {askForMissingValues} from '../util/interactive';

export const create: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'create',
    describe: 'Create a note.',
    builder: (y) => {
        y.example('$0', 'create');
        y.example('$0', 'create --no-interactive --issue 12345');
        y.boolean('editor')
            .describe('editor', 'Open the created note inside your $EDITOR.')
            .default('editor', true);
        y.boolean('interactive')
            .describe('interactive', 'Ask for missing values interactively.')
            .default('interactive', true);
        y.version(false);
        return pipe(
            getConfig(),
            E.map((c) => c.fields),
            E.map(
                A.reduce(y, (y, current) => {
                    y.string(current.name);
                    if (current.list) {
                        y.array(current.name);
                    }

                    y.describe(current.name, current.description ?? 'No description.');
                    return y;
                })
            ),
            E.getOrElse((err) => y.epilogue(err))
        );
    },
    handler: async (args) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {editor, interactive} = args;
        const config = getConfigOrExit();
        const fieldValues: StringNoteValues = toRecord(
            config.fields
                .map((f) => [f.name, args[f.name]] as const)
                .filter((x): x is [string, string[] | string] => x[1] !== undefined && x[1] !== null)
        );

        return pipe(
            decodeStringHeader(config.fields, fieldValues),
            E.mapLeft((e) => e.join('\n')),
            TE.fromEither,
            interactive ? TE.chain(askForMissingValues(config.fields)) : identity,
            TE.chain((values) =>
                pipe(
                    replacePlaceholders(values, config.fields, config.template.file),
                    (file) => findUnusedFile(config.basedir, file),
                    TE.right,
                    TE.chainFirst(createDirectoryOfFile),
                    TE.chain((file) =>
                        writeFile(
                            file,
                            toYamlString(encodeHeader(config.fields, values), config.fields, config.template.text)
                        )
                    )
                )
            ),
            editor ? TE.chain(openInEditor) : identity,
            TE.fold(T.fromIOK(printAndExit), T.fromIOK(print))
        )();
    },
};
