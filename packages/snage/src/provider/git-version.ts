import {FieldValue, RawProvidedField} from '../config/type';
import * as O from 'fp-ts/lib/Option';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import {ProviderFactory, requireArgument, ValueProvider} from './provider';
import {pipe} from 'fp-ts/lib/function';
import path from 'path';
import {tryExec} from './exec';
import {decodeValue} from '../note/convert';

export const providerFactory: ProviderFactory = (field: RawProvidedField): E.Either<string, ValueProvider> =>
    pipe(
        requireArgument(field, 'version-regex', 'string'),
        E.map(
            (versionRegex) =>
                (file: string): TE.TaskEither<string, FieldValue | undefined> =>
                    getVersion(versionRegex, file, field)
        )
    );

const getVersion = (
    versionRegex: string,
    file: string,
    field: RawProvidedField
): TE.TaskEither<string, FieldValue | undefined> =>
    pipe(
        getFirstTagContainingFile(file, versionRegex),
        TE.mapLeft((error): string => `provider error on field '${field.name}': ${error}`),
        TE.chainEitherK(
            O.fold(
                () => E.right<string, FieldValue | undefined>(undefined),
                (version): E.Either<string, FieldValue | undefined> =>
                    E.either.mapLeft(decodeValue(field, version), (errors) => errors.join('\n'))
            )
        )
    );

const getFirstTagContainingFile = (file: string, versionRegex: string): TE.TaskEither<string, O.Option<string>> => {
    const filename = path.basename(file);
    const directory = path.dirname(file);
    return pipe(
        fetchCommit(directory, filename),
        TE.chain((commit) =>
            pipe(
                O.option.traverse(TE.taskEither)(commit, (commit) => getTag(directory, commit, versionRegex)),
                TE.map(O.flatten)
            )
        )
    );
};

const fetchCommit = (directory: string, filename: string): TE.TaskEither<string, O.Option<string>> =>
    pipe(
        tryExec(`git log -n 1 --diff-filter=A --pretty=format:%H -- "${filename}"`, {
            cwd: directory,
        }),
        TE.map(O.fromPredicate((commit) => typeof commit !== 'undefined' && commit !== ''))
    );

const getTag =
    (directory: string, commit: string, versionRegex: string): TE.TaskEither<string, O.Option<string>> =>
    async (): Promise<E.Either<string, O.Option<string>>> => {
        const excludes: string[] = [];
        while (true) {
            const result = await pipe(
                tryExec(`git name-rev --tags ${excludes.join(' ')} --name-only "${commit}"`, {cwd: directory}),
                TE.map((tag) => tag.trim())
            )();

            if (E.isLeft(result)) {
                return result;
            }
            const rawTag = result.right;
            // name-rev returns the string undefined when there are no tags left
            if (typeof rawTag === 'undefined' || rawTag === '' || rawTag === 'undefined') {
                return E.right(O.none);
            }
            const tag = rawTag.replace(/[~^].*/, '');
            if (tag) {
                const match = RegExp(versionRegex).exec(tag);
                if (match) {
                    return E.right(O.some(match[1]));
                }
                excludes.push(`--exclude ${tag}`);
            }
        }
    };
