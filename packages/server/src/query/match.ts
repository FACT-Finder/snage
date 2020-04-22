import {Field, Note} from '../../../shared/type';
import {Expression, Operator, SingleExpression} from './parser';
import {expectNever, ffVersionRegex} from '../util/util';
import semver from 'semver';
import stringsimi from 'string-similarity';
import {zip} from 'fp-ts/lib/Array';

interface Matcher {
    (n: Note): boolean;
}

export const createMatcher = (e: Expression, fields: Field[]): Matcher => {
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
    const conf = fields.find((f) => f.name === field);
    if (!conf) {
        throw new Error('illegal state');
    }
    if (conf.list) {
        return (note) => {
            if (!note[field]) {
                return false;
            }
            return (note[field] as []).some((noteValue) => checkValue(noteValue, value, conf.type, op));
        };
    }
    return (note) => checkValue(note[field], value, conf.type, op);
};

export const checkValue = (left: any, right: any, type: Field['type'], operator: Operator): boolean => {
    if (type === 'semver') {
        return semver.satisfies(left, `${operator}${right}`);
    }
    if (type === 'ffversion') {
        return checkFFVersion(left, right, operator);
    }
    switch (operator) {
        case '<':
            return left < right;
        case '<=':
            return left <= right;
        case '>=':
            return left >= right;
        case '>':
            return left > right;
        case '=':
            return left === right;
        case '!=':
            return left !== right;
        case '~':
            return left?.includes(right);
        case '~~':
            if (!left || !right) {
                return false;
            }
            const rightParts = right.split(' ');
            const leftParts = left.split(' ');
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