import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';

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
