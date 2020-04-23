import moment from 'moment';
import {Config, Field} from '../../../shared/type';
import {Either, left, right} from 'fp-ts/lib/Either';

export const isValidDate = (date: string, dateFormat: string): boolean => {
    return moment(date, [dateFormat]).isValid();
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

export const dateValidator = (value: any, dateFormat: string, isOptional?: boolean): boolean | string => {
    if (isOptional || (!isBlank(value) && isValidDate(value, dateFormat))) {
        return true;
    }
    return 'Please enter a date in one of the supported formats: ' + dateFormat;
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

export const dateSetValidator = (value: any, dateFormat: string, isOptional?: boolean): boolean | string => {
    const values = value.split(',');
    if (!hasNoDuplicate(values)) {
        return 'Duplicates are not allowed in sets';
    }
    if (!isOptional && isBlank(value)) {
        return 'Non-optional lists are not supposed to be empty';
    }
    const valid = values.every(isValidDate);
    return valid ? true : 'Must be a correct list of dates in one of the formats ' + dateFormat + ", separated by ','.";
};

const hasNoDuplicate = (values: any[]): boolean => {
    return new Set(values).size === values.length;
};

export const validateFileNameSchema = (config: Config, fields: string[]): Either<string, boolean> => {
    if (!config.filename) {
        return left('filename property in config must not be missing or empty');
    }

    for (const fieldName of fields) {
        const field = getFieldByName(config, fieldName);
        if (field != null) {
            if (field.optional || field.list) {
                return left('Fields used in the file name must not be optional or lists: ' + fieldName);
            }
        } else {
            return left('You have defined a field with ${...} in the fieldname that is not in the actual field list: ' + fieldName);
        }
    }
    return right(true);
};

const getFieldByName = (config: Config, name: string): Field | null => {
    for (const field of config.fields) {
        if (field.name == name) {
            return field;
        }
    }
    return null;
};
