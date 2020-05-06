import matter from 'gray-matter';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import * as R from 'fp-ts/lib/Record';
import * as O from 'fp-ts/lib/Option';
import {pipe} from 'fp-ts/lib/pipeable';
import {Config, Field, FieldValue, hasProvider, ProvidedField} from '../config/type';
import {Note} from './note';
import {merge, readdir, readFile, sequenceKeepAllLefts, toRecord} from '../fp/fp';
import {decodeHeader} from './convert';

export const parseNotes = (config: Config, folder: string): TE.TaskEither<string[], Note[]> => {
    return pipe(
        readdir(folder),
        TE.mapLeft((e) => [e]),
        TE.map((files) => readNotes(config.fields, files)),
        TE.flatten
    );
};

const readNotes = (fields: Field[], files: string[]): TE.TaskEither<string[], Note[]> => {
    return pipe(
        A.array.traverse(T.task)(files, (file) => readNote(fields, file)),
        T.map(sequenceKeepAllLefts),
        TE.mapLeft(A.flatten)
    );
};

export const readNote = (fields: Field[], fileName: string): TE.TaskEither<string[], Note> => {
    return pipe(
        readFile(fileName),
        TE.mapLeft((e) => [e]),
        TE.chain((fileContent) => parseNote(fields, parseRawNote(fileContent, fileName)))
    );
};

export interface RawNote {
    file: string;
    header: Record<string, unknown>;
    summary: string;
    content: string;
}

const parseRawNote = (note: string, fileName: string): RawNote => {
    const {content, ...meta} = matter(note);
    const [head, ...rest] = content.split('\n\n');
    return {file: fileName, header: meta.data, summary: head, content: rest.join('\n\n')};
};

export const parseNote = (fields: Field[], rawNote: RawNote): TE.TaskEither<string[], Note> => {
    return pipe(
        decodeHeader(fields, rawNote.header),
        TE.fromEither,
        TE.chain(runProviders(rawNote.file, fields)),
        TE.chainEitherK(verifyRequiredFields(fields)),
        TE.mapLeft(A.map((error) => `${rawNote.file}: ${error}`)),
        TE.map((values) => ({
            values: values,
            id: rawNote.file,
            file: rawNote.file,
            content: rawNote.content,
            summary: rawNote.summary.replace(/^\s*#\s*/, ''),
        }))
    );
};

const runProviders = (noteFile: string, fields: Field[]) => (
    values: Record<string, FieldValue>
): TE.TaskEither<string[], Record<string, FieldValue>> => {
    const runProvider = (field: ProvidedField): TE.TaskEither<string, [string, FieldValue | undefined]> => {
        return pipe(
            field.provider(noteFile),
            TE.map((value) => [field.name, value])
        );
    };

    return pipe(
        fields,
        A.filter(hasProvider),
        A.filter((f) => O.isNone(R.lookup(f.name, values))),
        (fields) => A.array.traverse(TE.taskEither)(fields, runProvider),
        TE.map(A.filter((pair): pair is [string, FieldValue] => typeof pair[1] !== 'undefined')),
        TE.map((provided) => merge(values, toRecord(provided))),
        TE.mapLeft((error) => [error])
    );
};

const verifyRequiredFields = (fields: Field[]) => (values: Record<string, any>): E.Either<string[], Record<string, any>> => {
    const missingRequiredFields = pipe(
        fields,
        A.filter((f) => !f.optional),
        A.filter((f) => O.isNone(R.lookup(f.name, values)))
    );
    return A.isEmpty(missingRequiredFields)
        ? E.right(values)
        : E.left(A.array.map(missingRequiredFields, (f) => `Missing value for required field ${f.name}`));
};
