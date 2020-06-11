import matter from 'gray-matter';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import * as R from 'fp-ts/lib/Record';
import * as O from 'fp-ts/lib/Option';
import {pipe} from 'fp-ts/lib/pipeable';
import {Config, Field, FieldValue, hasProvider, ProvidedField, LinkProvider, CSSProvider} from '../config/type';
import {Note} from './note';
import {merge, readdir, readFile, sequenceKeepAllLefts, toRecord} from '../fp/fp';
import {decodeHeader} from './convert';
import YAML from 'yaml';

export const parseNotes = (config: Config): TE.TaskEither<string[], Note[]> => {
    return pipe(
        readdir(config.basedir),
        TE.mapLeft((e) => [e]),
        TE.chain((files) => readNotes(config.fields, config.note.links, config.note.styles, files))
    );
};

const readNotes = (fields: Field[], linkProvider: LinkProvider, styleProvider: CSSProvider, files: string[]): TE.TaskEither<string[], Note[]> => {
    return pipe(
        A.array.traverse(T.task)(files, (file) => readNote(fields, linkProvider, styleProvider, file)),
        T.map(sequenceKeepAllLefts),
        TE.mapLeft(A.flatten)
    );
};

export const readNote = (
    fields: Field[],
    linkProvider: LinkProvider,
    styleProvider: CSSProvider,
    fileName: string
): TE.TaskEither<string[], Note> => {
    return pipe(
        readFile(fileName),
        TE.mapLeft((e) => [e]),
        TE.map((content) => parseRawNote(content, fileName)),
        TE.chain(parseNote(fields, linkProvider, styleProvider)),
        TE.mapLeft((errors) => errors.map((error) => `${fileName}: ${error}`))
    );
};

export const parseNote = (fields: Field[], linkProvider: LinkProvider, styleProvider: CSSProvider) => (
    rawNote: RawNote
): TE.TaskEither<string[], Note> => {
    return pipe(
        parseNoteValues(fields, rawNote),
        TE.chain(runProviders(fields)),
        TE.chainEitherK(verifyRequiredFields(fields)),
        TE.map(fillLinks(linkProvider)),
        TE.map(fillStyle(styleProvider))
    );
};

const fillLinks = (linkProvider: LinkProvider) => (note: Note): Note => ({...note, links: linkProvider(note.values)});
const fillStyle = (styleProvider: CSSProvider) => (note: Note): Note => ({...note, style: styleProvider(note)});

export interface RawNote {
    file: string;
    header: Record<string, unknown>;
    summary: string;
    content: string;
}

export const parseRawNote = (note: string, fileName: string): RawNote => {
    const {content, ...meta} = matter(note, {
        language: 'yaml',
        engines: {
            yaml: YAML.parse,
        },
    });
    const [head, ...rest] = content.split('\n\n');
    return {file: fileName, header: meta.data, summary: head, content: rest.join('\n\n')};
};

export const parseNoteValues = (fields: Field[], rawNote: RawNote): TE.TaskEither<string[], Note> => {
    return pipe(
        decodeHeader(fields, rawNote.header),
        TE.fromEither,
        TE.mapLeft(A.map((error) => `${rawNote.file}: ${error}`)),
        TE.map((values) => ({
            values: values,
            id: rawNote.file,
            file: rawNote.file,
            links: [],
            style: {},
            content: rawNote.content,
            summary: rawNote.summary.replace(/^\s*#\s*/, ''),
        }))
    );
};

const runProviders = (fields: Field[]) => (note: Note): TE.TaskEither<string[], Note> => {
    const runProvider = (field: ProvidedField): TE.TaskEither<string, [string, FieldValue | undefined]> => {
        return pipe(
            field.provider(note.file),
            TE.map((value) => [field.name, value])
        );
    };

    return pipe(
        fields,
        A.filter(hasProvider),
        A.filter((f) => O.isNone(R.lookup(f.name, note.values))),
        (fields) => A.array.traverse(TE.taskEither)(fields, runProvider),
        TE.map(A.filter((pair): pair is [string, FieldValue] => typeof pair[1] !== 'undefined')),
        TE.map((provided) => ({...note, values: merge(note.values, toRecord(provided))})),
        TE.mapLeft((error) => [error])
    );
};

const verifyRequiredFields = (fields: Field[]) => (note: Note): E.Either<string[], Note> => {
    const missingRequiredFields = pipe(
        fields,
        A.filter((f) => !f.optional),
        A.filter((f) => O.isNone(R.lookup(f.name, note.values)))
    );
    return A.isEmpty(missingRequiredFields)
        ? E.right(note)
        : E.left(A.array.map(missingRequiredFields, (f) => `Missing value for required field ${f.name}`));
};
