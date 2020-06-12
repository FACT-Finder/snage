import {Field, FieldType, RawField} from '../config/type';
import {Note} from '../note/note';
import * as O from 'fp-ts/lib/Option';
import * as A from 'fp-ts/lib/Array';
import * as R from 'fp-ts/lib/Record';
import * as ORD from 'fp-ts/lib/Ord';
import semver from 'semver';
import {expectNever, requiredFFVersionRegex} from '../util/util';
import {pipe} from 'fp-ts/lib/pipeable';
import {LocalDate} from '@js-joda/core';
import {sign} from 'fp-ts/lib/Ordering';
import {identity} from 'fp-ts/lib/function';

export const getOrdering = (field: Field | RawField, order: 'asc' | 'desc', absent: 'last' | 'first'): ORD.Ord<Note> =>
    pipe(
        getFieldOrdering(field.type),
        (o): ORD.Ord<any> => (field.list ? listOrdering(o) : o),
        order === 'asc' ? identity : ORD.getDualOrd,
        ordOptional(absent),
        ORD.contramap((note: Note) => R.lookup(field.name, note.values))
    );

type OptionOrd = <T>(ord: ORD.Ord<T>) => ORD.Ord<O.Option<T>>;
const ordOptional = (absent: 'last' | 'first'): OptionOrd => (absent === 'first' ? nullFirst : nullLast);
const nullFirst: OptionOrd = (ord) =>
    ORD.fromCompare((a, b) => (O.isSome(a) ? (O.isSome(b) ? ord.compare(a.value, b.value) : 1) : O.isSome(b) ? -1 : 0));
const nullLast: OptionOrd = (ord) =>
    ORD.fromCompare((a, b) => (O.isSome(a) ? (O.isSome(b) ? ord.compare(a.value, b.value) : -1) : O.isSome(b) ? 1 : 0));

const listOrdering = <T>(ordering: ORD.Ord<T>): ORD.Ord<T[]> => ORD.ord.contramap(O.getOrd(ordering), A.head);

export const getFieldOrdering = (type: FieldType): ORD.Ord<any> => {
    switch (type) {
        case 'string':
            return ORD.ordString;
        case 'boolean':
            return ORD.ordBoolean;
        case 'date':
            return dateOrd;
        case 'number':
            return ORD.ordNumber;
        case 'semver':
            return semverOrd;
        case 'ffversion':
            return ffVersionOrd;
        default:
            return expectNever(type);
    }
};

export const dateOrd: ORD.Ord<LocalDate> = ORD.fromCompare<LocalDate>((x, y) => sign(x.compareTo(y)));

const semverOrd: ORD.Ord<semver.SemVer> = ORD.fromCompare(semver.compare);

const parseFFVersion = (s: string): [number, number, number, number] => {
    const exec = requiredFFVersionRegex.exec(s);
    // first entry is whole string
    const [a, b, c, d] = exec!.slice(1).map((part) => (part !== 'SNAPSHOT' ? parseInt(part, 10) : -1));
    return [a, b, c, d];
};

const ffVersionOrd: ORD.Ord<string> = ORD.ord.contramap(
    ORD.getTupleOrd(ORD.ordNumber, ORD.ordNumber, ORD.ordNumber, ORD.ordNumber),
    parseFFVersion
);
