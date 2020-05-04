import {Field, FieldValue, RawProvidedField} from '../config/type';
import {FileParseError, ParseError, parseSingleValue} from '../note/parser';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import {ProviderFactory, requireArgument, ValueProvider} from './provider';
import {pipe} from 'fp-ts/lib/pipeable';
import path from 'path';
import {tryExec} from './exec';

export const providerFactory: ProviderFactory = (field: RawProvidedField): E.Either<string, ValueProvider> =>
    pipe(
        requireArgument(field, 'version-regex', 'string'),
        E.map((versionRegex) => (file: string): TE.TaskEither<FileParseError, FieldValue | undefined> => getVersion(versionRegex, file, field))
    );

const getVersion = (versionRegex: string, file: string, field: Field): TE.TaskEither<FileParseError, FieldValue | undefined> => {
    return pipe(
        getFirstTagContainingFile(file),
        TE.map(O.map((tag) => extractVersion(tag, versionRegex))),
        TE.mapLeft((error): ParseError => ({field: field.name, msg: error, error: 'providerError' as const})),
        TE.chainEitherK(
            O.fold(
                () => E.right<ParseError, FieldValue | undefined>(undefined),
                (version) => parseSingleValue(version, field, true)
            )
        ),
        TE.mapLeft((e): FileParseError => ({...e, file}))
    );
};

const getFirstTagContainingFile = (file: string): TE.TaskEither<string, O.Option<string>> => {
    const filename = path.basename(file);
    const directory = path.dirname(file);
    return pipe(
        fetchCommit(directory, filename),
        TE.chain((commit) =>
            pipe(
                O.option.traverse(TE.taskEither)(commit, (commit) => getTag(directory, commit)),
                TE.map(O.flatten)
            )
        )
    );
};

const fetchCommit = (directory: string, filename: string): TE.TaskEither<string, O.Option<string>> =>
    pipe(
        tryExec(`git log -n 1 --diff-filter=A --pretty=format:%H -- "${filename}"`, {cwd: directory}),
        TE.map(O.fromPredicate((commit) => typeof commit !== 'undefined' && commit !== ''))
    );

const getTag = (directory: string, commit: string): TE.TaskEither<string, O.Option<string>> =>
    pipe(
        tryExec(`git name-rev --tags --name-only "${commit}"`, {cwd: directory}),
        TE.map((tag) => tag.trim()),
        TE.map(O.fromPredicate((tag) => typeof tag !== 'undefined' && tag !== '' && tag !== 'undefined')),
        TE.map(O.map((rawTag) => rawTag.replace(/[~^].*/, '')))
    );

const extractVersion = (tag: string, versionRegex: string): string => tag.replace(RegExp(versionRegex), (match, version) => version);
