import {getFunctionName, ValidationError} from 'io-ts';

export enum ReportMode {
    Simple,
    WithPath,
}

export const stringifyErrors =
    (mode: ReportMode) =>
    (errors: ValidationError[]): string[] =>
        errors.map(stringifyError(mode));

const stringifyError =
    (mode: ReportMode) =>
    ({message, context, value}: ValidationError): string => {
        if (message !== undefined) {
            return message;
        }

        const path = context
            .map(({key}) => key)
            .filter((key) => key !== '')
            .join('.');
        const type = context[context.length - 1].type.name;

        if (path === '' || mode === ReportMode.Simple) {
            return `invalid value ${stringifyValue(value)}, expected ${type}`;
        }

        return `invalid value ${stringifyValue(value)} on ${path}, expected ${type}`;
    };

const stringifyValue = (v: any): string => {
    if (typeof v === 'function') {
        return getFunctionName(v);
    }
    if (typeof v === 'number' && !isFinite(v)) {
        if (isNaN(v)) {
            return 'NaN';
        }
        return v > 0 ? 'Infinity' : '-Infinity';
    }
    return JSON.stringify(v);
};
