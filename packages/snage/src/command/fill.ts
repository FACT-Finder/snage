import yargs from 'yargs';
import {DefaultCli, printAndExit} from './common';
import {getConfig} from '../config/load';
import {parseNotes} from '../note/parser';
import {pipe} from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as A from 'fp-ts/lib/Array';
import {Note} from '../note/note';
import {writeFile} from '../fp/fp';
import {summaryWithContent, toYamlFromDocument} from '../note/tostring';
import {encodeValue} from '../note/convert';
import {Field} from '../config/type';

export const fill: yargs.CommandModule<DefaultCli, DefaultCli & {on?: string; field: string[]}> = {
    command: 'fill [field..]',
    describe: 'Fill [field..] with values from providers.',
    builder: (y) =>
        y
            .string('on')
            .example('$0', 'fill version')
            .positional('field', {type: 'string', describe: 'The field name', array: true}) as any,
    handler: async ({field: fieldNames}) =>
        await pipe(
            TE.fromEither(getConfig()),
            TE.chain((config) =>
                pipe(
                    parseNotes(config),
                    TE.mapLeft((errors) => errors.join('\n')),
                    TE.map(A.filter(canFill(fieldNames))),
                    TE.map(A.map(fillInHeader(config.fields, fieldNames))),
                    TE.chain((notes) => A.array.traverse(TE.taskEither)(notes, writeNote))
                )
            ),
            TE.mapLeft(T.fromIOK(printAndExit))
        )(),
};

export const fillInHeader =
    (fields: Field[], fieldNames: string[]) =>
    (note: Note): Note => {
        fieldNames.forEach((name) => {
            const value = note.values[name];
            if (value !== undefined) {
                note.valuesDocument.set(name, encodeValue(fields.find((field) => field.name === name)!, value));
            }
        });
        return note;
    };

export const canFill =
    (fieldNames: string[]) =>
    (note: Note): boolean =>
        fieldNames.some((name) => note.values[name] !== note.valuesDocument.get(name, false));

const writeNote = (note: Note): TE.TaskEither<string, void> =>
    pipe(
        writeFile(note.file, toYamlFromDocument(note.valuesDocument, summaryWithContent(note.summary, note.content))),
        TE.map(() => console.log(`${note.file}`))
    );
