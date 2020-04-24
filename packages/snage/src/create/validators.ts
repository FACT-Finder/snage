import {isValid} from 'date-fns';
import {parseFromTimeZone} from 'date-fns-timezone';
import {Either, left, right} from 'fp-ts/lib/Either';
import {Field, Config} from '../config/type';

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

export const numberValidator = (value: any, isOptional?: boolean): boolean | string => {
    if (isOptional || (!isNaN(value) && !isBlank(value))) {
        return true;
    }
    return 'Must be a correct number';
};

export const numberSetValidator = (value: any, isOptional?: boolean): boolean | string => {
    const values = value.split(',');
    if (!hasNoDuplicate(values)) {
        return 'Duplicates are not allowed in sets';
    }
    if (!isOptional && isBlank(value)) {
        return 'Non-optional lists are not supposed to be empty';
    }
    const valid = values.every((value) => numberValidator(value, isOptional));
    return valid ? true : "Must be a correct list of numbers separated by separated by ','.";
};

export const stringSetValidator = (value: any, isOptional?: boolean): boolean | string => {
    const values = value.split(',');
    if (!hasNoDuplicate(values)) {
        return 'Duplicates are not allowed in sets';
    }
    if (isOptional && isBlank(value)) {
        return 'Non-optional lists are not supposed to be empty';
    }
    return true;
};

export const dateSetValidator = (value: any, isOptional?: boolean): boolean | string => {
    const values = value.split(',');
    if (!hasNoDuplicate(values)) {
        return 'Duplicates are not allowed in sets';
    }
    if (!isOptional && isBlank(value)) {
        return 'Non-optional lists are not supposed to be empty';
    }
    const valid = values.every(isValidDate);
    return valid ? true : `Must be a correct list of dates separated by ','.`;
};

const hasNoDuplicate = (values: any[]): boolean => {
    return new Set(values).size === values.length;
};

export const validateFileNameSchema = (config: Config, fields: Field[]): Either<string, boolean> => {
    for (const field of fields) {
        if (field.optional || field.list) {
            return left('Fields used in the file name must not be optional or lists: ' + field.name);
        }
    }
    return right(true);
};
