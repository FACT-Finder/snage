import yargs from 'yargs';
import {Config, Field} from "../../shared/type";
import {askUserForFieldValue} from "./consoleWizzard";
import {isValidDate} from "./validators";
import {expectNever} from "../../server/src/util/util";
import {Either, isLeft, left, right} from "fp-ts/lib/Either";

const NO_WIZARD_LABEL:string = "noWizard";

const addType = (field: Field, yargs: yargs.Argv) => {
    if (field.list) {
        yargs.array(field.name);
        return;
    }
    switch (field.type) {
        case "semver": // intentional fallthrough since semver isn't supported by yargs
        case "date": // intentional fallthrough since date isn't supported by yargs
        case "ffversion": // intentional fallthrough since ffversion isn't supported by yargs
        case "string": {
            yargs.string(field.name);
            return;
        }
        case "boolean": {
            yargs.boolean(field.name);
            return;
        }
        case "number": {
            yargs.number(field.name);
            return;
        }
        default: {
            expectNever(field.type)
        }
    }
};

const addDescription = (fields: Field[], yargs: yargs.Argv) => {
    let description = {};
    description[NO_WIZARD_LABEL] = "Prevents the wizard from starting when fields aren't set. Options are: \n" +
        "t - fills all missing required fields with the needed data type as placeholder\n" +
        "to - fills all missing required and optional fields with the needed data type as placeholder\n" +
        "if no option is provided, the fields will simply be missing, but must be added per hand to obtain a valid change log";
    fields.forEach(field => description[field.name] = field.description ? field.description : '');
    yargs.describe(description);
};

const addAlias = (fields: Field[], yargs: yargs.Argv) => {
    let alias = {};
    alias[NO_WIZARD_LABEL] = "nw";
    fields.filter(field => field.alias).map(field => alias[field.name] = field.alias);
    yargs.alias(alias);
};

/**
 * Parses all parameters from the cli into the fields defined in the config. For fields defined in the config but missing in the cli,
 * an interactive wizard is started started in the terminal to fill in the missing field values
 *
 * @param nodeArgV command line arguments
 * @param config the configuration used to create the changelog files
 *
 * @returns a promise containing an Either with a dictionary in the style of {fieldName: fieldValue, ...} in right or an error message in left
 */
export const parseLogParameters = async (nodeArgV: string[], config: Config): Promise<Either<string, {}>> => {
    const builder = yargs(nodeArgV);
    builder.string(NO_WIZARD_LABEL);
    config.fields.forEach(field => addType(field, builder));
    addDescription(config.fields, builder);
    addAlias(config.fields, builder);
    const argv = builder.argv;

    return await buildLogParameters(config.fields, argv, config.supportedDateFormat);
};

const buildLogParameters = async (fields: Field[], consoleArguments: {}, supportedDateFormat: string): Promise<Either<string, {}>> => {
    let returnValues = {};
    for (let field of fields) {
        if (consoleArguments[field.name] != null) {
            if (field.type == "date" && !isValidDate(consoleArguments[field.name], supportedDateFormat)) {
                return left('Error: Invalid date format. Please enter the date in the following format: ' + supportedDateFormat);
            }
            returnValues[field.name] = consoleArguments[field.name];
        } else {
            const result = await handleMissingValue(field, consoleArguments, supportedDateFormat, returnValues);
            if(isLeft(result)){
                return left(result.left);
            }
        }
    }
    return right(returnValues);
};

const handleMissingValue = (async (field: Field, consoleArguments: {}, supportedDateFormat: string, returnValues: {}): Promise<Either<string, true>> => {
    if (consoleArguments[NO_WIZARD_LABEL] == null) {
        let fieldValue = await askUserForFieldValue(field, supportedDateFormat);
        if (fieldValue != null) {
            returnValues[field.name] = fieldValue;
        }
    } else if (consoleArguments[NO_WIZARD_LABEL] == 'to' || (consoleArguments[NO_WIZARD_LABEL] == 't' && !field.optional)) {
        fillEmptyFieldWithDataType(field, supportedDateFormat, returnValues);
    } else if (consoleArguments[NO_WIZARD_LABEL] != null && !(consoleArguments[NO_WIZARD_LABEL] == 'to' || consoleArguments[NO_WIZARD_LABEL] == 't')){
        return left('Invalid usage of --' + NO_WIZARD_LABEL + ": " + consoleArguments[NO_WIZARD_LABEL] + ". Check --help for more info.");
    }
    return right(true);
});

const fillEmptyFieldWithDataType = (field: Field, supportedDateFormat: string, returnValues: {}) => {
    if(field.enum) {
        returnValues[field.name] = getEnumString(field);
    } else {
        returnValues[field.name] = field.type == "date"? supportedDateFormat : field.type;
    }
    if(field.list) {
        returnValues[field.name] = [returnValues[field.name]];
    }
};

const getEnumString = (field: Field): string => {
    let enumString: string = "";
    field.enum?.forEach(entry => enumString = enumString + entry + ' | ');
    return enumString.substr(0, enumString.length -3);
};