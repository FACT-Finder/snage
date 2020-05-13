import {Expression, Operator, SingleExpression, StatusOP, StatusValue} from './parser';
import {expectNever, ffVersionRegex} from '../util/util';
import semver from 'semver';
import stringsimi from 'string-similarity';
import {zip} from 'fp-ts/lib/Array';
import {Field} from '../config/type';
import {Note} from '../note/note';
import {ContentField, ImplicitFields, SummaryField} from './implicitfields';

export type MatcherNote = Pick<Note, 'content' | 'summary' | 'values'>;

interface Matcher {
    (n: MatcherNote): boolean;
}

export const createMatcher = (e: Expression, fields: Field[]): Matcher => {
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

export const createSimpleExpression = (e: SingleExpression, fields: Field[]): Matcher => {
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
        default:
            return note.values[name];
    }
};

export const checkValue = (noteValue: any, queryValue: any, type: Field['type'], operator: Operator): boolean => {
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
    if (type === 'semver') {
        return semver.satisfies(noteValue, `${operator}${queryValue}`);
    }
    if (type === 'ffversion') {
        return checkFFVersion(noteValue, queryValue, operator);
    }
    switch (operator) {
        case '<':
            return noteValue < queryValue;
        case '<=':
            return noteValue <= queryValue;
        case '>=':
            return noteValue >= queryValue;
        case '>':
            return noteValue > queryValue;
        case '=':
            return noteValue === queryValue;
        case '!=':
            return noteValue !== queryValue;
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

const checkFFVersion = (left: string, right: string, operator: Operator): boolean => {
    if (left === undefined || right === undefined) {
        return false;
    }

    const vLeft = [...parseVersion(left), 0, 0, 0, 0];
    const vRight = parseVersion(right);
    const zipped = zip(vLeft, vRight);
    switch (operator) {
        case '!=':
            return zipped.some(([l, r]) => l !== r);
        case '=':
            return zipped.every(([l, r]) => l === r);
        case '<':
            return compareFFVersion(zipped, CompareResult.LessThan);
        case '<=':
            return compareFFVersion(zipped, CompareResult.LessThan) || checkFFVersion(left, right, '=');
        case '>':
            return compareFFVersion(zipped, CompareResult.GreaterThan);
        case '>=':
            return compareFFVersion(zipped, CompareResult.GreaterThan) || checkFFVersion(left, right, '=');
        default:
            throw new Error(`illegal operator ${operator}`);
    }
};

enum CompareResult {
    Equal,
    LessThan,
    GreaterThan,
}

const compareFFVersion = (versions: Array<[number, number]>, is: CompareResult): boolean => {
    for (const [l, r] of versions) {
        if (l > r) {
            return is === CompareResult.GreaterThan;
        }
        if (l < r) {
            return is === CompareResult.LessThan;
        }
    }
    return is === CompareResult.Equal;
};

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
