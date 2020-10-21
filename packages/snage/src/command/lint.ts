import yargs from 'yargs';
import {getConfig} from '../config/load';
import {parseNotes} from '../note/parser';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import {DefaultCli, printAndExit} from './common';
import {pipe} from 'fp-ts/lib/pipeable';
import {checkFormatMultiple, formatNote} from '../note/format';
import {Note} from '../note/note';
import {TEsequenceKeepAllLefts, writeFile} from '../fp/fp';
import {summaryWithContent, toYamlFromDocument} from '../note/tostring';
import {PrettierConfig} from '../config/type';

export const lint: yargs.CommandModule<DefaultCli, DefaultCli & {fix?: boolean}> = {
    command: 'lint',
    describe: 'Lint all notes.',
    builder: (y) =>
        y
            .example('$0', 'lint')
            .option('fix', {boolean: true, default: false, description: 'try to fix existing errors'}),
    handler: async ({fix = false}) =>
        pipe(
            TE.fromEither(getConfig()),
            TE.chain((config) =>
                pipe(
                    parseNotes(config),
                    TE.chain((notes) =>
                        fix
                            ? formatAndWriteNotes(config.note.lint.prettier, notes)
                            : TE.fromEither(checkFormatMultiple(config.note.lint.prettier, notes))
                    ),
                    TE.mapLeft((errors) => errors.join('\n'))
                )
            ),
            TE.fold(T.fromIOK(printAndExit), () => T.fromIO(() => console.log('All good :D')))
        )(),
};

const formatAndWriteNotes = (config: PrettierConfig, notes: Note[]): TE.TaskEither<string[], Note[]> => {
    const TEs = notes.map((note) =>
        TE.taskEither.chain(TE.fromEither(formatNote(config, note)), (newNote) => {
            if (newNote.content === note.content) {
                return TE.right(note);
            }
            console.log('Writing', note.file);
            return writeNote(newNote);
        })
    );
    return TEsequenceKeepAllLefts(TEs);
};

const writeNote = (note: Note): TE.TaskEither<string, Note> =>
    pipe(
        writeFile(note.file, toYamlFromDocument(note.valuesDocument, summaryWithContent(note.summary, note.content))),
        TE.map(() => note)
    );
