import yargs from 'yargs';
import {askUserForFieldValue} from './consoleWizzard';
import {
    booleanSetValidator,
    booleanValidator,
    dateSetValidator,
    dateValidator,
    noBlankValuesValidator,
    numberSetValidator,
    numberValidator,
    semverSetValidator,
    semverValidator,
    stringSetValidator,
} from './validators';
import {expectNever} from '../util/util';
import {Either, isLeft, left, right} from 'fp-ts/lib/Either';
import {Config, Field} from '../config/type';

const INTERACTIVE_LABEL = 'interactive';

export interface ConsoleParamsError {
    msg: string;
}

const addType = (field: Field, yargs: yargs.Argv) => {
    if (field.list) {
        yargs.array(field.name);
        return;
    }
    switch (field.type) {
        case 'semver': // intentional fallthrough since semver isn't supported by yargs
        case 'date': // intentional fallthrough since date isn't supported by yargs
        case 'ffversion': // intentional fallthrough since ffversion isn't supported by yargs
        case 'string': {
            yargs.string(field.name);
            return;
        }
        case 'boolean': {
            yargs.boolean(field.name);
            return;
        }
        case 'number': {
            yargs.number(field.name);
            return;
        }
        default: {
            expectNever(field.type);
        }
    }
};

const addDescription = (fields: Field[], yargs: yargs.Argv) => {
    const interactiveDescription =
        'Starts a wizard asking for all field values not already added within the call of this script. \n' +
        "Defaults to true, can be called with --no-interactive to prevent the wizard from starting. In this case, all fields you didn't provide a value for" +
        'will have empty values in the generated file. Optional fields will be commented out in the file.';
    const description = fields.reduce((all, field) => ({...all, [field.name]: field.description ?? ''}), {});
    description[INTERACTIVE_LABEL] = interactiveDescription;
    yargs.describe(description);
};

const addAlias = (fields: Field[], yargs: yargs.Argv) => {
    const alias = {};
    fields.filter((field) => field.alias).map((field) => (alias[field.name] = field.alias));
    yargs.alias(alias);
};

export const addToYargs = (builder: yargs.Argv, config: Config): yargs.Argv => {
    builder.boolean(INTERACTIVE_LABEL);
    config.fields.forEach((field) => addType(field, builder));
    addDescription(config.fields, builder);
    addAlias(config.fields, builder);
    return builder;
};

export const handleFieldValues = async (fields: Field[], consoleArguments: {}): Promise<Either<ConsoleParamsError, Record<string, unknown>>> => {
    const returnValues = {};
    for (const field of fields) {
        if (consoleArguments[field.name] != null) {
            const isValid = validateInput(field, consoleArguments[field.name]);
            if (isLeft(isValid)) {
                return left(isValid.left);
            }
            returnValues[field.name] = consoleArguments[field.name];
        } else {
            const result = await handleMissingValue(field, consoleArguments, returnValues);
            if (isLeft(result)) {
                return left(result.left);
            }
        }
    }
    return right(returnValues);
};

//FIXME - extract validation and unify it with code from consoleWizzard.ts : https://github.com/FACT-Finder/snage/issues/50
const validateInput = (field: Field, consoleArgument: unknown): Either<ConsoleParamsError, true> => {
    let validation;
    switch (field.type) {
        case 'date':
            validation = field.list
                ? dateSetValidator(String(consoleArgument), field.optional)
                : dateValidator(String(consoleArgument), field.optional);
            break;
        case 'semver':
            validation = field.list ? semverSetValidator(consoleArgument, field.optional) : semverValidator(consoleArgument, field.optional);
            break;
        case 'ffversion': // intentional fallthrough
        case 'string': {
            validation = field.list ? stringSetValidator(consoleArgument, field.optional) : noBlankValuesValidator(consoleArgument, field.optional);
            break;
        }
        case 'boolean': {
            validation = field.list ? booleanSetValidator(consoleArgument, field.optional) : booleanValidator(consoleArgument, field.optional);
            break;
        }
        case 'number': {
            validation = field.list ? numberSetValidator(consoleArgument, field.optional) : numberValidator(consoleArgument, field.optional);
            break;
        }
        default: {
            expectNever(field.type);
        }
    }

    if (validation !== true) {
        return left({msg: `Invalid value provided for field ${field.name}: ${validation}`});
    }
    return right(true);
};

const handleMissingValue = async (field: Field, consoleArguments: {}, returnValues: {}): Promise<Either<ConsoleParamsError, true>> => {
    if (consoleArguments[INTERACTIVE_LABEL] == null || consoleArguments[INTERACTIVE_LABEL]) {
        const fieldValue = await askUserForFieldValue(field);
        if (fieldValue != null) {
            returnValues[field.name] = fieldValue;
        }
    } else {
        returnValues[field.name] = null;
    }
    return right(true);
};
