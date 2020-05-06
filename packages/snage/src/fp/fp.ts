import * as A from 'fp-ts/lib/Array';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import fs from 'fs';
import path from 'path';
import {pipe} from 'fp-ts/lib/pipeable';
import {getFirstSemigroup} from 'fp-ts/lib/Semigroup';
import * as R from 'fp-ts/lib/Record';

export function assertRight<L, R>(either: E.Either<L, R>): asserts either is E.Right<R> {
    if (E.isLeft(either)) {
        throw new Error(`expected right, got ${JSON.stringify(either)}`);
    }
}

export function assertLeft<L, R>(either: E.Either<L, R>): asserts either is E.Left<L> {
    if (E.isRight(either)) {
        throw new Error(`expected left, got ${JSON.stringify(either)}`);
    }
}

export const sequenceKeepAllLefts = <L, R>(eithers: Array<E.Either<L, R>>): E.Either<L[], R[]> => {
    const {left, right} = A.separate(eithers);
    return left.length ? E.left(left) : E.right(right);
};

export const readdir = (directory: string): TE.TaskEither<string, string[]> =>
    pipe(
        TE.taskify<string, NodeJS.ErrnoException, string[]>(fs.readdir)(directory),
        TE.mapLeft((e) => `Could not read directory ${directory}: ${e}`),
        TE.map(A.map((file) => path.join(directory, file)))
    );

export const readFile = (fileName: string): TE.TaskEither<string, string> =>
    pipe(
        TE.taskify<string, string, NodeJS.ErrnoException, string>(fs.readFile)(fileName, 'utf8'),
        TE.mapLeft((e: NodeJS.ErrnoException): string => `Could not read file ${fileName}: ${e}`)
    );

export const writeFile = (fileName: string, content: string): TE.TaskEither<string, string> =>
    pipe(
        TE.taskify<string, string, NodeJS.ErrnoException, string>(fs.writeFile)(fileName, content),
        TE.mapLeft((e: NodeJS.ErrnoException): string => `Could not write file ${fileName}: ${e}`)
    );

export const toRecord = <V>(values: Array<[string, V]>): Record<string, V> => {
    const First = getFirstSemigroup<V>();
    return R.fromFoldable(First, A.array)(values);
};

export const merge = <V>(a: Record<string, V>, b: Record<string, V>): Record<string, V> => {
    const First = getFirstSemigroup<V>();
    return R.getMonoid(First).concat(a, b);
};
