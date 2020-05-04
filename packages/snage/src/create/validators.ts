import {isValid} from 'date-fns';
import {parseFromTimeZone} from 'date-fns-timezone';
import {Either, left, right} from 'fp-ts/lib/Either';
import {Field, Config} from '../config/type';
import semver from 'semver';

export const isValidDate = (date: string): boolean => {
    return isValid(parseFromTimeZone(date, {timeZone: 'UTC'}));
};

export const noBlankValuesValidator = (value: any, isOptional?: boolean): boolean | string => {
    if (isOptional || !isBlank(value)) {
        return true;
    }
    return 'Blank values are not allowed';
};

export const isBlank = (value: any): boolean => {
    return typeof value == 'undefined' || value.trim() == '';
};

export const listSelectionValidator = (values: any[], isOptional?: boolean): boolean | string => {
    if (isOptional || values.length > 0) {
        return true;
    }
    return 'Please select at least one option from the list for non optional fields';
};

export const dateValidator = (value: any, isOptional?: boolean): boolean | string => {
    if (isOptional || (!isBlank(value) && isValidDate(value))) {
        return true;
    }
    return "Please enter a date in format 'YYYY-MM-DD'";
};

export const semverValidator = (value: any, isOptional?: boolean): boolean | string => {
    const version = semver.parse(value);
    if (typeof value !== 'string' || version === null || noBlankValuesValidator(value, isOptional)) {
        return 'Must be a correct SemVer';
    }
    return true;
};

export const semverSetValidator = (value: any, isOptional?: boolean): boolean | string => {
    return validatorForSets(value, semverValidator, isOptional) ? true : "Must be a correct list of SemVer values separated by ','.";
};

export const numberValidator = (value: any, isOptional?: boolean): boolean | string => {
    const maybeNumber = Number(value);
    if (isOptional || (!isNaN(maybeNumber) && !isBlank(value))) {
        return true;
    }
    return 'Must be a correct number';
};

export const numberSetValidator = (value: any, isOptional?: boolean): boolean | string => {
    return validatorForSets(value, numberValidator, isOptional) ? true : "Must be a correct list of numbers separated by separated by ','.";
};

export const stringSetValidator = (value: any, isOptional?: boolean): boolean | string => {
    return validatorForSets(value, undefined, isOptional);
};

const validatorForSets = (value: any, validator?: (value: any, isOptional?: boolean) => boolean | string, isOptional?: boolean): boolean | string => {
    value += '';
    const values = value.split(',');
    if (!hasNoDuplicate(values)) {
        return 'Duplicates are not allowed in sets';
    }
    if (!isOptional && isBlank(value)) {
        return 'Non-optional lists are not supposed to be empty';
    }
    if (validator === undefined) {
        return true;
    }
    return values.every((entry) => validator(entry, isOptional) === true);
};

export const booleanSetValidator = (value: any, isOptional?: boolean): boolean | string => {
    return validatorForSets(value, booleanValidator, isOptional) ? true : `Must be a correct set of booleans separated by ','.`;
};

export const booleanValidator = (value: any, isOptional?: boolean): boolean | string => {
    if (isOptional && isBlank(value)) {
        return 'Non-optional lists are not supposed to be empty';
    }
    if (value == 'true' || value == 'false') {
        return true;
    }
    return 'Boolean values are expected to be provided as \'true\' or \'false\'.';
};

export const dateSetValidator = (value: any, isOptional?: boolean): boolean | string => {
    return validatorForSets(value, dateValidator, isOptional) ? true : `Must be a correct list of dates separated by ','.`;
};

const hasNoDuplicate = (values: any[]): boolean => {
    return new Set(values).size === values.length;
};

export const validateFileNameSchema = (config: Config, fields: Field[]): Either<string, boolean> => {
    for (const field of fields) {
        if (field.optional) {
            return left(`Referenced field '${field.name}' is optional. Only required fields may be used.`);
        }
        if (field.list) {
            return left(`Referenced field '${field.name}' is a list type. Only non list types may be used.`);
        }
    }
    return right(true);
};
