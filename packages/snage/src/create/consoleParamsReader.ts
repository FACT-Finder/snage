import yargs from 'yargs';
import {askUserForFieldValue} from './consoleWizzard';
import {isValidDate, numberValidator} from './validators';
import {expectNever} from '../util/util';
import {Either, isLeft, left, right} from 'fp-ts/lib/Either';
import {Config, Field} from '../config/type';

const INTERACTIVE_LABEL = 'interactive';

export interface ConsoleParamsError {
    msg?: string;
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

export const buildLogParameters = async (fields: Field[], consoleArguments: {}): Promise<Either<ConsoleParamsError, FieldForOutput[]>> => {
    const returnValues = {};
    for (const field of fields) {
        if (consoleArguments[field.name] != null) {
            if (field.type == 'date' && !isValidDate(consoleArguments[field.name])) {
                return left({msg: "Error: Invalid date format. Please enter the date in format 'YYYY-MM-DD'"});
            }
            if (field.type == 'number' && !numberValidator(consoleArguments[field.name], field.optional)) {
                return left({msg: `Error: Invalid number for field:  ${field.name}`});
            }
            returnValues[field.name] = consoleArguments[field.name];
        } else {
            const result = await handleMissingValue(field, consoleArguments, returnValues);
            if (isLeft(result)) {
                return left(result.left);
            }
        }
    }
    return right(getAdjustedData(returnValues, fields));
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

const getAdjustedData = (metaValues: Record<string, unknown>, fields: Field[]):FieldForOutput[]  => {
    const adjustedRecords: FieldForOutput[] = [];
    fields
        .filter((field) => field.name in metaValues)
        .forEach((field) => {
            adjustedRecords.push({optional: !!field.optional, list: !!field.list, name: field.name, value: metaValues[field.name]});
        });
    return adjustedRecords;
};

//FIXME I'm not happy with that name since it bleeds the purpose for later down the line instead of accurately describing it. Any suggestions?
export interface FieldForOutput {
    optional: boolean;
    list: boolean;
    name: string;
    value: unknown;
}
