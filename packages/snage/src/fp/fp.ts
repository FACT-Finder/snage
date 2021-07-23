import * as A from 'fp-ts/lib/Array';
import * as TE from 'fp-ts/lib/TaskEither';
import * as E from 'fp-ts/lib/Either';
import * as IOE from 'fp-ts/lib/IOEither';
import fs from 'fs';
import path from 'path';
import {defaultEditor, getEditor} from 'env-editor';
import {pipe} from 'fp-ts/lib/function';
import {first} from 'fp-ts/lib/Semigroup';
import * as R from 'fp-ts/lib/Record';
import {spawn} from 'child_process';

export function assertRight<L, R>(either: E.Either<L, R>): asserts either is E.Right<R> {
    if (E.isLeft(either)) {
        throw new Error(`expected right, got ${JSON.stringify(either)}`);
    }
}

export function extractRight<L, R>(either: E.Either<L, R>): R {
    assertRight(either);
    return either.right;
}

export function assertLeft<L, R>(either: E.Either<L, R>): asserts either is E.Left<L> {
    if (E.isRight(either)) {
        throw new Error(`expected left, got ${JSON.stringify(either)}`);
    }
}

export function extractLeft<L, R>(either: E.Either<L, R>): L {
    assertLeft(either);
    return either.left;
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

export const readFileSync = (fileName: string): IOE.IOEither<string, string> =>
    IOE.tryCatch(
        () => fs.readFileSync(fileName, 'utf-8'),
        (e) => `Could not read ${fileName}: ${e}`
    );

export const writeFile = (fileName: string, content: string): TE.TaskEither<string, string> =>
    pipe(
        TE.taskify<string, string, NodeJS.ErrnoException, string>(fs.writeFile)(fileName, content),
        TE.bimap(
            (e: NodeJS.ErrnoException): string => `Could not write file ${fileName}: ${e}`,
            () => fileName
        )
    );

export const toRecord = <V>(values: Array<[string, V]>): Record<string, V> => {
    const First = first<V>();
    return R.fromFoldable(First, A.array)(values);
};

export const merge = <V>(a: Record<string, V>, b: Record<string, V>): Record<string, V> => {
    const First = first<V>();
    return R.getMonoid(First).concat(a, b);
};

export const findUnusedFile = (folder: string, fileName: string): string => {
    if (!fs.existsSync(path.join(folder, fileName))) {
        return path.join(folder, fileName);
    }
    const lastDot = fileName.lastIndexOf('.') === -1 ? fileName.length : fileName.lastIndexOf('.');
    const prefix = fileName.substring(0, lastDot);
    const suffix = fileName.substring(lastDot, fileName.length);

    for (let i = 2; ; i++) {
        const newFileName = `${prefix}${i}${suffix}`;
        if (!fs.existsSync(path.join(folder, newFileName))) {
            return path.join(folder, newFileName);
        }
    }
};

export const createDirectoryOfFile = (fileName: string): TE.TaskEither<string, void> => {
    const directory = path.dirname(fileName);
    return pipe(
        TE.taskify<string, {recursive: boolean}, NodeJS.ErrnoException, string>(fs.mkdir)(directory, {
            recursive: true,
        }),
        TE.bimap(
            (err) => `Could not create directory ${directory}: ${err}`,
            () => undefined
        )
    );
};

const unsetEditor = `\
Snage wants to open the note file inside an editor but
your $EDITOR environment variable is not set.
Using vim as default.`;

export const openInEditor = (file: string): TE.TaskEither<string, string> =>
    pipe(
        E.tryCatch(defaultEditor, () => unsetEditor),
        E.getOrElse((err) => {
            console.log(err);
            return getEditor('vim');
        }),
        ({isTerminalEditor, binary}) =>
            TE.tryCatch(
                () =>
                    new Promise((resolve, reject) => {
                        const cmd = spawn(binary, [file], {
                            detached: true,
                            stdio: isTerminalEditor ? 'inherit' : 'ignore',
                        });
                        cmd.on('exit', () => resolve(file));
                        cmd.on('error', reject);
                    }),
                (err) => `editor error: ${err}`
            )
    );
