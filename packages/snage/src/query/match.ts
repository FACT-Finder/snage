import {
    CompareOperator,
    Expression,
    isCompareOperator,
    Operator,
    SingleExpression,
    StatusOP,
    StatusValue,
} from './parser';
import {expectNever, ffVersionRegex} from '../util/util';
import semver from 'semver';
import stringsimi from 'string-similarity';
import {zip} from 'fp-ts/lib/Array';
import {Field, FieldType} from '../config/type';
import {Note} from '../note/note';
import {ContentField, IdField, ImplicitFields, SummaryField} from './implicitfields';
import * as ORD from 'fp-ts/lib/Ord';
import {getFieldOrdering} from './sort';

export type MatcherNote = Pick<Note, 'content' | 'summary' | 'values' | 'id'>;

export interface Matcher {
    (n: MatcherNote): boolean;
}

export type MatcherField = Pick<Field, 'name' | 'type' | 'list'>;

export const createMatcher = (e: Expression, fields: MatcherField[]): Matcher => {
    if (e === true) {
        return () => true;
    }
    if (Array.isArray(e)) {
        const [left, op, right] = e;
        if (op === 'or') {
            return (note) => createMatcher(left, fields)(note) || createMatcher(right, fields)(note);
        }
        return (note) => createMatcher(left, fields)(note) && createMatcher(right, fields)(note);
    }
    return createSimpleExpression(e, fields);
};

export const createSimpleExpression = (e: SingleExpression, fields: MatcherField[]): Matcher => {
    const {field, op, value} = e;
    const conf = fields.find((f) => f.name === field) ?? ImplicitFields.find((f) => f.name === field);
    if (!conf) {
        throw new Error('illegal state');
    }
    if (conf.list) {
        return (note) => {
            const noteValues = valueByName(field, note);
            if (!noteValues) {
                return false;
            }
            return (noteValues as unknown[]).some((noteValue) => checkValue(noteValue, value, conf.type, op));
        };
    }
    return (note) => checkValue(valueByName(field, note), value, conf.type, op);
};

const valueByName = (name: string, note: MatcherNote): undefined | unknown => {
    switch (name) {
        case ContentField.name:
            return note.content;
        case SummaryField.name:
            return note.summary;
        case IdField.name:
            return note.id;
        default:
            return note.values[name];
    }
};

export const checkValue = (noteValue: any, queryValue: any, type: FieldType, operator: Operator): boolean => {
    if (operator === StatusOP) {
        const status = queryValue as StatusValue;
        switch (status) {
            case StatusValue.Absent:
                return noteValue === undefined || noteValue === null;
            case StatusValue.Present:
                return noteValue !== undefined && noteValue !== null;
            default:
                return expectNever(status);
        }
    }

    if (isCompareOperator(operator)) {
        return compare(noteValue, queryValue, type, operator);
    }

    if (type !== 'string') {
        throw new Error(`illegal operator ${operator}`);
    }

    switch (operator) {
        case '~':
            return noteValue?.toLowerCase().includes(queryValue?.toLowerCase());
        case '~~':
            if (!noteValue || !queryValue) {
                return false;
            }
            const rightParts = queryValue.split(' ');
            const leftParts = noteValue.split(' ');
            for (const rightPart of rightParts) {
                if (!leftParts.some((leftPart) => stringsimi.compareTwoStrings(leftPart, rightPart) > 0.4)) {
                    return false;
                }
            }
            return true;
        default:
            return expectNever(operator);
    }
};

const compare = (noteValue: any, queryValue: any, type: FieldType, operator: CompareOperator): boolean => {
    if (type === 'semver') {
        return semver.satisfies(noteValue, `${operator}${queryValue}`);
    }
    if (type === 'ffversion') {
        return checkFFVersion(noteValue, queryValue, operator);
    }
    return checkOrd(getFieldOrdering(type), noteValue, queryValue, operator);
};

const checkOrd = <T>(
    ord: ORD.Ord<T>,
    left: T | undefined,
    right: T | undefined,
    operator: CompareOperator
): boolean => {
    if (left === undefined || right === undefined) {
        switch (operator) {
            case '!=':
                return left !== right;
            case '=':
                return left === right;
            default:
                return false;
        }
    }

    switch (operator) {
        case '!=':
            return !ord.equals(left, right);
        case '=':
            return ord.equals(left, right);
        case '<':
            return ORD.lt(ord)(left, right);
        case '<=':
            return ORD.leq(ord)(left, right);
        case '>':
            return ORD.gt(ord)(left, right);
        case '>=':
            return ORD.geq(ord)(left, right);
        default:
            return expectNever(operator);
    }
};

const checkFFVersion = (left: string, right: string, operator: CompareOperator): boolean => {
    if (left === undefined || right === undefined) {
        return false;
    }

    const vLeft = [...parseVersion(left), 0, 0, 0, 0];
    const vRight = parseVersion(right);
    return checkOrd(arrayOrd(), vLeft, vRight, operator);
};

const arrayOrd = (): ORD.Ord<number[]> =>
    ORD.fromCompare((ls, rs) => {
        for (const [l, r] of zip(ls, rs)) {
            if (l > r) {
                return 1;
            }
            if (l < r) {
                return -1;
            }
        }
        return 0;
    });

const parseVersion = (s: string): number[] => {
    const exec = ffVersionRegex.exec(s);
    if (!exec) {
        return [];
    }
    // first entry is whole string
    return exec
        .slice(1)
        .filter((x) => x !== undefined)
        .map((part) => (part !== 'SNAPSHOT' ? parseInt(part, 10) : -1));
};
