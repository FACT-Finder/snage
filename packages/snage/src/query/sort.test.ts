import {getFieldOrdering, getOrdering} from './sort';
import {Note, partialNote} from '../note/note';
import * as A from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import * as R from 'fp-ts/lib/Record';
import {pipe} from 'fp-ts/lib/pipeable';
import semver from 'semver/preload';
import {LocalDate} from '@js-joda/core';

describe('sort', () => {
    describe('getOrdering', () => {
        const notes: Note[] = [
            partialNote({values: {number: 3, list: [1, 2]}}),
            partialNote({values: {number: 5, list: [2]}}),
            partialNote({values: {number: 1, list: [0]}}),
            partialNote({values: {}}),
        ];

        test('number:desc nullLast', () => {
            const ordering = getOrdering({name: 'number', type: 'number'}, 'desc', 'last');
            expect(
                pipe(
                    notes,
                    A.sort(ordering),
                    A.map((note) => R.lookup('number', note.values))
                )
            ).toStrictEqual([O.some(5), O.some(3), O.some(1), O.none]);
        });
        test('number:asc nullLast', () => {
            const ordering = getOrdering({name: 'number', type: 'number'}, 'asc', 'last');
            expect(
                pipe(
                    notes,
                    A.sort(ordering),
                    A.map((note) => R.lookup('number', note.values))
                )
            ).toStrictEqual([O.some(1), O.some(3), O.some(5), O.none]);
        });

        test('number:desc nullFirst', () => {
            const ordering = getOrdering({name: 'number', type: 'number'}, 'desc', 'first');
            expect(
                pipe(
                    notes,
                    A.sort(ordering),
                    A.map((note) => R.lookup('number', note.values))
                )
            ).toStrictEqual([O.none, O.some(5), O.some(3), O.some(1)]);
        });
        test('number:asc nullFirst', () => {
            const ordering = getOrdering({name: 'number', type: 'number'}, 'asc', 'first');
            expect(
                pipe(
                    notes,
                    A.sort(ordering),
                    A.map((note) => R.lookup('number', note.values))
                )
            ).toStrictEqual([O.none, O.some(1), O.some(3), O.some(5)]);
        });
        test('list number:asc nullFirst', () => {
            const ordering = getOrdering({name: 'list', type: 'number', list: true}, 'asc', 'first');
            expect(
                pipe(
                    notes,
                    A.sort(ordering),
                    A.map((note) => R.lookup('list', note.values))
                )
            ).toStrictEqual([O.none, O.some([0]), O.some([1, 2]), O.some([2])]);
        });
        test('list number:asc nullLast', () => {
            const ordering = getOrdering({name: 'list', type: 'number', list: true}, 'asc', 'last');
            expect(
                pipe(
                    notes,
                    A.sort(ordering),
                    A.map((note) => R.lookup('list', note.values))
                )
            ).toStrictEqual([O.some([0]), O.some([1, 2]), O.some([2]), O.none]);
        });
    });

    describe('getFieldOrdering', () => {
        test('semver', () => {
            expect(
                pipe(
                    ['2.0.1', '2.0.0', '1.1.0', '1.12.5', '1.2.0'],
                    A.map((v) => semver.parse(v)),
                    A.sort(getFieldOrdering('semver')),
                    A.map((v) => v?.format())
                )
            ).toStrictEqual(['1.1.0', '1.2.0', '1.12.5', '2.0.0', '2.0.1']);
        });
        test('ffversion', () => {
            expect(
                pipe(['5.0.0-0', '1.1.0-15', '1.1.0-13', '1.12.5-0', '1.2.0-0'], A.sort(getFieldOrdering('ffversion')))
            ).toStrictEqual(['1.1.0-13', '1.1.0-15', '1.2.0-0', '1.12.5-0', '5.0.0-0']);
        });
        test('date', () => {
            expect(
                pipe(
                    ['2017-09-02', '2017-08-01', '2018-09-01', '2017-09-01'],
                    A.map((d) => LocalDate.parse(d)),
                    A.sort(getFieldOrdering('date')),
                    A.map((d) => d.toString())
                )
            ).toStrictEqual(['2017-08-01', '2017-09-01', '2017-09-02', '2018-09-01']);
        });
        test('boolean', () => {
            expect(pipe([true, false, true], A.sort(getFieldOrdering('boolean')))).toStrictEqual([false, true, true]);
        });
        test('string', () => {
            expect(pipe(['b', 'a', 'ab', 'aa', 'ba'], A.sort(getFieldOrdering('string')))).toStrictEqual([
                'a',
                'aa',
                'ab',
                'b',
                'ba',
            ]);
        });
    });
});
