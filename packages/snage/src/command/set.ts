import yargs from 'yargs';
import {DefaultCli, printAndExit} from './common';
import {getConfig} from '../config/load';
import {parseNotes} from '../note/parser';
import matter from 'gray-matter';
import {createParser} from '../query/parser';
import {createMatcher} from '../query/match';
import {pipe} from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as IO from 'fp-ts/lib/IO';
import * as IOE from 'fp-ts/lib/IOEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import {Note} from '../note/note';
import {Field, FieldValue} from '../config/type';
import {writeFile} from '../fp/fp';
import {decodeStringValue, encodeHeader} from '../note/convert';

interface Options {
    fields: Field[];
    condition?: string;
    fieldName: string;
    stringValue: string[];
    notes: Note[];
}

interface FileResult {
    file: string;
    content: string;
}

export const set: yargs.CommandModule<DefaultCli, DefaultCli & {on?: string; field: string; value: string[]}> = {
    command: 'set <field> [value..]',
    describe: 'Set <field> to [value..] if [condition].',
    builder: (y) =>
        y
            .string('on')
            .example('$0', 'set --on "version unset" version 1.0.0')
            .example('$0', 'set --on "issue = #22"   issue "#33"')
            .example('$0', 'set --on "issue = #22"   issue   # unset issue field')
            .describe('on', 'Condition for setting values')
            .positional('field', {type: 'string', describe: 'The field name'})
            .positional('value', {array: true, type: 'string', describe: 'The field values (Empty if unset)'}) as any,
    handler: async ({field: fieldName, value: stringValue, on}) => {
        return pipe(
            TE.fromEither(getConfig()),
            TE.chain((config) =>
                pipe(
                    parseNotes(config),
                    TE.mapLeft((errors) => errors.join('\n')),
                    TE.chainEitherK((notes) => updateNotes({fields: config.fields, notes, condition: on, stringValue, fieldName}))
                )
            ),
            TE.fold(T.fromIOK(printAndExit), writeNotes)
        )();
    },
};

const parseValue = (fields: Field[], fieldName: string, stringValue: string[]): E.Either<string, FieldValue | undefined> => {
    const field = fields.find((field) => field.name === fieldName);
    if (!field) {
        return E.left(`Field ${fieldName} does not exist`);
    }

    if (!field.optional && stringValue.length === 0) {
        return E.left(`${field.name} is required but no values were provided.`);
    }
    if (field.optional && stringValue.length === 0) {
        return E.right(undefined);
    }
    if (!field?.list && stringValue.length > 1) {
        return E.left(`Field ${fieldName} is not a list field. You may only provide one value.`);
    }
    const value = field?.list ? stringValue : stringValue[0];
    return pipe(
        decodeStringValue(field, value),
        E.mapLeft((err) => err.join('\n'))
    );
};

export const updateNotes = ({
    fields,
    condition,
    fieldName,
    stringValue,
    notes,
}: Options): E.Either<string, Array<{file: string; content: string}>> => {
    return pipe(
        parseValue(fields, fieldName, stringValue),
        E.chain((value) =>
            pipe(
                //
                filterNotes(condition, fields, notes),
                E.map(A.map(setValue(value, fieldName, fields)))
            )
        )
    );
};

const filterNotes = (condition: string | undefined, fields: Field[], notes: Note[]): E.Either<string, Note[]> => {
    return pipe(
        createParser(fields)(condition ?? ''),
        E.bimap(
            (e) => `Invalid expression ${condition} ${JSON.stringify(e)}`,
            (expression) => {
                const matcher = createMatcher(expression, fields);
                return notes.filter(matcher);
            }
        )
    );
};

const setValue = (value: unknown, fieldName: string, fields: Field[]) => ({file, summary, content, values}): FileResult => {
    const copy = {...values};
    if (value === undefined) {
        delete copy[fieldName];
    } else {
        copy[fieldName] = value;
    }
    const mergedContent = `# ${summary}${content.trim() !== '' ? '\n\n' : ''}${content}`;
    const result = matter.stringify(mergedContent, encodeHeader(fields, copy));
    return {file: file, content: result};
};

const writeNotes = (files: FileResult[]): T.Task<string[]> => {
    return pipe(
        A.array.traverse(T.task)(files, writeNote),
        T.map((results) => T.fromIO(A.array.traverse(IO.io)(results, reportResult))),
        T.flatten,
        T.map((results) => A.array.sequence(E.either)(results)),
        TE.getOrElse(() => T.fromIO<string[]>(printAndExit('Could not write all files :/')))
    );
};

const writeNote = (file: FileResult): TE.TaskEither<string, string> => {
    return pipe(
        writeFile(file.file, file.content),
        TE.map(() => `${file.file}`)
    );
};

const reportResult = (result: E.Either<string, string>): IOE.IOEither<string, string> => () =>
    pipe(
        result,
        E.bimap(
            (error) => {
                console.error(error);
                return error;
            },
            (writtenFile) => {
                console.log(writtenFile);
                return writtenFile;
            }
        )
    );
