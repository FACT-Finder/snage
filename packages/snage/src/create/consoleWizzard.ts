import * as inquirer from 'inquirer';
import {
    dateSetValidator,
    dateValidator,
    isBlank,
    listSelectionValidator,
    noBlankValuesValidator,
    numberSetValidator,
    numberValidator,
    stringSetValidator,
} from './validators';
import {expectNever} from '../util/util';
import {Field} from '../config/type';
import {LocalDate} from '@js-joda/core';

/**
 * Asks the user to provide a valid value for the given field in an interactive way on the cli
 * For optional fields, a prompt will ask the user if he wants to provide data
 *
 * @param field the user needs to provide a value for
 *
 * @returns a Promise containing either the given value, or null if the field is optional and no value has been provided
 */
export const askUserForFieldValue = async (field: Field): Promise<any> => {
    return await askForInputForFieldByTypes(field);
};

const askForInputForFieldByTypes = async (field: Field) => {
    const prefix = field.optional ? '[OPTIONAL] ' : '';
    if (field.enum) {
        let type = 'rawlist';
        if (field.list) {
            type = 'checkbox';
        }
        return await askForUserInputWithChoices(
            type,
            prefix + 'Select ' + field.name,
            field.name,
            field.enum,
            listSelectionValidator,
            field.optional
        );
    }
    switch (field.type) {
        case 'date':
            return await askForDateInput(field);
        case 'semver': // intentional fallthrough since semver isn't supported by inquirer
        case 'ffversion': // intentional fallthrough since ffversion isn't supported by inquirer
        case 'string':
            return await askForStringInput(field);
        case 'number':
            return await askForNumberInput(field);
        case 'boolean':
            return await askForBooleanInput(field);
        default:
            expectNever(field.type);
    }
    return null;
};

const askForStringInput = async (field: Field) => {
    let value;
    const prefix = field.optional ? '[OPTIONAL] ' : '';
    if (field.list) {
        value = await askForUserInput(
            'input',
            prefix + 'Please enter unique values for ' + field.name,
            field.name,
            stringSetValidator,
            field.optional
        );
        const values = String(value).split(',');
        return replaceBlankAndEmptyWithNull(values);
    }
    value = await askForUserInput('input', prefix + 'Please enter value for ' + field.name, field.name, noBlankValuesValidator, field.optional);
    return replaceBlankAndEmptyWithNull(value);
};

const askForNumberInput = async (field: Field) => {
    const prefix = field.optional ? '[OPTIONAL] ' : '';
    if (field.list) {
        const value = await askForUserInput(
            'input',
            prefix + 'Please enter unique values for ' + field.name + ", separated by ','.",
            field.name,
            numberSetValidator,
            field.optional
        );
        const values = String(value).split(',');
        return values.map(Number).map(replaceBlankAndEmptyWithNull);
    }
    //work around till NaN-problem is fixed: https://github.com/SBoudrias/Inquirer.js/pull/706
    let value = await askForUserInput('input', prefix + 'Please enter value for ' + field.name, field.name, numberValidator, field.optional);
    value = replaceBlankAndEmptyWithNull(value);
    return value == null ? null : Number(value);
};

const askForUserInput = async (
    type: inquirer.DistinctQuestion['type'],
    message: string,
    name: string,
    validator: (value: any, isOptional?: boolean) => boolean | string,
    isOptional?: boolean
) => {
    const answer = await inquirer.prompt({
        type: type,
        message: message,
        name: name,
        validate: (value) => validator(value, isOptional),
    });
    return answer[name];
};

const askForBooleanInput = async (field: Field) => {
    let type = 'rawlist';
    if (field.list) {
        type = 'checkbox';
    }
    return await askForUserInputWithChoices(
        type,
        'Select ' + field.name,
        field.name,
        [
            {name: 'true', value: true},
            {name: 'false', value: false},
        ],
        listSelectionValidator,
        field.optional
    );
};

const askForDateInput = async (field: Field) => {
    if (field.list) {
        const value = await askForDateInputFromUser(
            'input',
            `Please enter unique dates for ${field.name} in format 'YYYY-MM-DD'`,
            field.name,
            dateSetValidator,
            field.optional
        );
        const values = String(value).split(',');
        return replaceBlankAndEmptyWithNull(values);
    }
    if (await askYesNo('Do you want to set the current date for ' + field.name + '?')) {
        return LocalDate.now().toString();
    }
    const dateValue = await askForDateInputFromUser(
        'input',
        "Please enter a valid date in the format 'YYYY-MM-DD' for " + field.name,
        field.name,
        dateValidator,
        field.optional
    );
    return replaceBlankAndEmptyWithNull(dateValue);
};

const replaceBlankAndEmptyWithNull = (value: any) => {
    //special case that only occurs when the user entered blank value(s) for an optional field. That should be treated as no value for that field
    //because it is most likely that the user changed his mind or misclicked when asked if he wants to set the optional value
    if (Array.isArray(value) && value.length === 0) {
        return null;
    }
    if (typeof value === 'string' && isBlank(value)) {
        return null;
    }
    return value;
};

const askForUserInputWithChoices = async (
    type: any,
    message: string,
    name: string,
    choices: any,
    validator: (value: any, isOptional?: boolean) => boolean | string,
    isOptional?: boolean
) => {
    const answer = await inquirer.prompt({
        type: type,
        message: message,
        name: name,
        choices: choices,
        validate: (value) => validator(value, isOptional),
    });
    return answer[name];
};

const askForDateInputFromUser = async (
    type: inquirer.DistinctQuestion['type'],
    message: string,
    name: string,
    validator: (value: any, isOptional?: boolean) => boolean | string,
    isOptional?: boolean
) => {
    const answer = await inquirer.prompt({
        type: type,
        message: message,
        name: name,
        validate: (value) => validator(value, isOptional),
    });
    return answer[name];
};

const askYesNo = async (message: string): Promise<boolean> => {
    const shouldAskForOptionalField = await inquirer.prompt({
        type: 'confirm',
        message: message,
        name: 'confirmation',
        default: true,
    });
    return shouldAskForOptionalField['confirmation'];
};
