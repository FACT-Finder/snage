import * as A from 'fp-ts/lib/Array';
import * as E from 'fp-ts/lib/Either';
import {pipe} from 'fp-ts/lib/function';
import * as O from 'fp-ts/lib/Option';
import * as R from 'fp-ts/lib/Record';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

import {Config, CSS, CSSProvider, Field, hasProvider, LinkProvider, ProvidedField} from '../config/type';
import {readdir, readFile, sequenceKeepAllLefts, toRecord} from '../fp/fp';

import {decodeHeader} from './convert';
import {Note, NoteValues} from './note';

export const parseNotes = (config: Config): TE.TaskEither<string[], Note[]> =>
    pipe(
        readdir(config.basedir),
        TE.mapLeft((e) => [e]),
        TE.chain((files) => readNotes(config.fields, config.note.links, config.note.styles, files))
    );

const readNotes = (
    fields: Field[],
    linkProvider: LinkProvider,
    styleProvider: CSSProvider,
    files: string[]
): TE.TaskEither<string[], Note[]> =>
    pipe(
        files,
        A.filter((file) => fs.lstatSync(file).isFile()),
        (files) => A.array.traverse(T.task)(files, (file) => readNote(fields, linkProvider, styleProvider, file)),
        T.map(sequenceKeepAllLefts),
        TE.mapLeft(A.flatten)
    );

export const readNote = (
    fields: Field[],
    linkProvider: LinkProvider,
    styleProvider: CSSProvider,
    fileName: string
): TE.TaskEither<string[], Note> =>
    pipe(
        readFile(fileName),
        TE.mapLeft((e) => [e]),
        TE.chainEitherK((content) => E.Bifunctor.mapLeft(parseRawNote(content, fileName), (err) => [err])),
        TE.chain(parseNote(fields, linkProvider, styleProvider)),
        TE.mapLeft((errors) => errors.map((error) => `${fileName}: ${error}`))
    );

export const parseNote =
    (fields: Field[], linkProvider: LinkProvider, styleProvider: CSSProvider) =>
    (rawNote: RawNote): TE.TaskEither<string[], Note> =>
        pipe(
            parseNoteValues(fields, rawNote),
            TE.chain(runProviders(fields)),
            TE.chainEitherK(verifyRequiredFields(fields)),
            TE.map(fillLinks(linkProvider)),
            TE.map(fillStyle(fields, styleProvider))
        );

const fillLinks =
    (linkProvider: LinkProvider) =>
    (note: Note): Note => ({
        ...note,
        links: linkProvider(note.values),
    });
const fillStyle =
    (fields: Field[], noteStyle: CSSProvider) =>
    (note: Note): Note => ({
        ...note,
        style: noteStyle(note),
        valueStyles: toRecord(
            fields
                .map((field): [string, CSS | undefined] => [field.name, field.styleProvider?.(note)])
                .filter((x): x is [string, CSS] => typeof x[1] !== 'undefined')
        ),
    });

export interface RawNote {
    file: string;
    header: Record<string, unknown>;
    headerDocument: YAML.Document;
    summary: string;
    content: string;
}

export const parseRawNote = (note: string, fileName: string): E.Either<string, RawNote> => {
    const [, head, ...content] = note.split('---');
    const [summary, ...body] = content.join('---').trim().split('\n\n');

    try {
        return E.right({
            file: fileName,
            header: YAML.parse(head),
            headerDocument: YAML.parseDocument(head),
            summary: summary.trim().replace(/^\s*#\s*/, ''),
            content: body.join('\n\n'),
        });
    } catch (e: any) {
        return E.left(`ParseError: ${e?.toString() ?? 'unknown'}`);
    }
};

export const parseNoteValues = (fields: Field[], rawNote: RawNote): TE.TaskEither<string[], Note> =>
    pipe(
        decodeHeader(fields, rawNote.header),
        TE.fromEither,
        TE.map((values) => ({
            values,
            valuesDocument: rawNote.headerDocument,
            id: path.basename(rawNote.file),
            file: rawNote.file,
            links: [],
            style: {},
            valueStyles: {},
            content: rawNote.content,
            summary: rawNote.summary,
        }))
    );

const runProviders =
    (fields: Field[]) =>
    (note: Note): TE.TaskEither<string[], Note> => {
        const runProvider = (field: ProvidedField, values: NoteValues): TE.TaskEither<string, NoteValues> =>
            pipe(
                field.valueProvider(note.file, fields, values),
                TE.map((value) => (typeof value === 'undefined' ? values : R.insertAt(field.name, value)(values)))
            );

        return pipe(
            fields,
            A.filter(hasProvider),
            A.filter((f) => O.isNone(R.lookup(f.name, note.values))),
            reduceProviders(note.values)(runProvider),
            TE.map((values) => ({...note, values})),
            TE.mapLeft((error) => [error])
        );
    };

const reduceProviders =
    (values: NoteValues) =>
    (f: (field: ProvidedField, values: NoteValues) => TE.TaskEither<string, NoteValues>) =>
    (fields: ProvidedField[]): TE.TaskEither<string, NoteValues> => {
        const result: TE.TaskEither<string, NoteValues> = TE.right(values);

        return fields.reduce((r, field) => TE.taskEither.chain(r, (v) => f(field, v)), result);
    };

const verifyRequiredFields =
    (fields: Field[]) =>
    (note: Note): E.Either<string[], Note> => {
        const missingRequiredFields = pipe(
            fields,
            A.filter((f) => !f.optional),
            A.filter((f) => O.isNone(R.lookup(f.name, note.values)))
        );
        return A.isEmpty(missingRequiredFields)
            ? E.right(note)
            : E.left(A.array.map(missingRequiredFields, (f) => `Missing value for required field ${f.name}`));
    };
