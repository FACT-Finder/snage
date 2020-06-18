import * as inquirer from 'inquirer';
import {
    dateSetValidator,
    dateValidator,
    isBlank,
    noBlankValuesValidator,
    numberSetValidator,
    numberValidator,
    stringSetValidator,
} from './validators';
import {expectNever} from '../util/util';
import {Field, FieldValue} from '../config/type';
import {LocalDate} from '@js-joda/core';
import * as T from 'fp-ts/lib/Task';
import * as O from 'fp-ts/lib/Option';
import * as A from 'fp-ts/lib/Array';
import {NoteValues} from "../note/note";
import {pipe} from "fp-ts/lib/pipeable";
import {merge, toRecord} from "../fp/fp";

export const askForMissingValues = (fields: Field[]) => (values: NoteValues): T.Task<NoteValues> => {
    const existing = Object.keys(values);
    const missingFields = fields.filter((f) => !existing.includes(f.name));
    return pipe(
        A.array.traverse(T.taskSeq)(missingFields, (f) => askValue(f)),
        T.map(A.filterMap((x) => x)),
        T.map((xs) => merge(values, toRecord(xs)))
    );
};

const askValue = (field: Field): T.Task<O.Option<[string, FieldValue]>> => {
    return pipe(askUserForFieldValue(field), T.map(O.map((v): [string, FieldValue] => [field.name, v])));
};

export const askUserForFieldValue = (field: Field): T.Task<O.Option<FieldValue>> =>
    T.task.map(() => askForInputForFieldByTypes(field), O.fromNullable);

const askForInputForFieldByTypes = async (field: Field) => {
    if (field.enum) {
        return select(`Select ${field.name}`, field.enum, field.list, field.optional);
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
    value = await askForUserInput(
        'input',
        prefix + 'Please enter value for ' + field.name,
        field.name,
        noBlankValuesValidator,
        field.optional
    );
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
    let value = await askForUserInput(
        'input',
        prefix + 'Please enter value for ' + field.name,
        field.name,
        numberValidator,
        field.optional
    );
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
    const choices = [
        {name: 'true', value: true},
        {name: 'false', value: false},
    ];
    return select(`Select ${field.name}`, choices, field.list, field.optional);
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

const select = async <T>(
    message: string,
    choices: Array<string | {name: string; value: T | null}>,
    list: boolean = false,
    optional: boolean = false
) => (list ? multiSelect(message, choices, optional) : singleSelect(message, choices, optional));

const multiSelect = async <T>(
    message: string,
    choices: Array<string | {name: string; value: T | null}>,
    optional = false
) => {
    const answer = await inquirer.prompt({type: 'checkbox', message, name: 'field', choices});
    const value = answer['field'];
    return optional && Array.isArray(value) && value.length === 0 ? null : value;
};

const singleSelect = async <T>(
    message: string,
    choices: Array<string | {name: string; value: T | null}>,
    optional = false
) => {
    const noChoice = {name: '[no value]', value: null};

    const answer = await inquirer.prompt({
        type: 'list',
        message,
        name: 'field',
        choices: optional ? A.cons(noChoice, choices) : choices,
    });
    return answer['field'];
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
