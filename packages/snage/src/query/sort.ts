import {Field, FieldType} from '../config/type';
import {Note} from '../note/note';
import * as O from 'fp-ts/lib/Option';
import * as A from 'fp-ts/lib/Array';
import * as R from 'fp-ts/lib/Record';
import * as ORD from 'fp-ts/lib/Ord';
import semver from 'semver';
import {expectNever, requiredFFVersionRegex} from '../util/util';
import {pipe} from 'fp-ts/lib/pipeable';

export const getOrdering = (field: Field, order: 'asc' | 'desc'): ORD.Ord<Note> => {
    return pipe(
        getFieldOrdering(field.type),
        (o): ORD.Ord<any> => (field.list ? listOrdering(o) : o),
        (o) => (order === 'asc' ? ORD.getDualOrd(o) : o),
        O.getOrd,
        ORD.getDualOrd,
        ORD.contramap((note: Note) => R.lookup(field.name, note.values))
    );
};

const listOrdering = <T>(ordering: ORD.Ord<T>): ORD.Ord<T[]> => {
    return ORD.ord.contramap(O.getOrd(ordering), A.head);
};

export const getFieldOrdering = (type: FieldType): ORD.Ord<any> => {
    switch (type) {
        case 'string':
            return ORD.ordString;
        case 'boolean':
            return ORD.ordBoolean;
        case 'date':
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

const semverOrd: ORD.Ord<semver.SemVer> = ORD.fromCompare(semver.compare);

const parseFFVersion = (s: string): [number, number, number, number] => {
    const exec = requiredFFVersionRegex.exec(s);
    // first entry is whole string
    const [a, b, c, d] = exec!.slice(1).map((part) => (part !== 'SNAPSHOT' ? parseInt(part, 10) : -1));
    return [a, b, c, d];
};

const ffVersionOrd: ORD.Ord<string> = ORD.ord.contramap(ORD.getTupleOrd(ORD.ordNumber, ORD.ordNumber, ORD.ordNumber, ORD.ordNumber), parseFFVersion);