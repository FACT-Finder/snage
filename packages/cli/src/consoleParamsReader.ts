import yargs from 'yargs';
import {Config, Field} from "../../shared/type";
import {askUserForFieldValue} from "./consoleWizzard";
import {isValidDate, supportedDateFormats} from "./validators";
import {expectNever} from "../../server/src/util/util";
import {Either, left, right} from "fp-ts/lib/Either";

const addType = (field: Field, yargs: yargs.Argv) => {
    if (field.list) {
        yargs.array(field.name);
        return true;
    }
    switch (field.type) {
        case "semver": // intentional fallthrough since semver isn't supported by yargs
        case "date": // intentional fallthrough since date isn't supported by yargs
        case "ffversion": // intentional fallthrough since ffversion isn't supported by yargs
        case "string": {
            yargs.string(field.name);
            return true;
        }
        case "boolean": {
            yargs.boolean(field.name);
            return true;
        }
        case "number": {
            yargs.number(field.name);
            return true;
        }
        default: {
            return expectNever(field.type)
        }
    }
};

const addDescription = (fields: Field[], yargs: yargs.Argv) => {
    let description = {};
    fields.forEach(field => description['' + field.name] = field.description ? field.description : '');
    yargs.describe(description);
};

//TODO Add man page and abbreviations for cli parameters
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
    config.fields.forEach(field => addType(field, builder));
    addDescription(config.fields, builder);
    const argv = builder.argv;

    return await buildLogParameters(config.fields, argv);
};

const buildLogParameters = async (fields: Field[], consoleArguments: {}): Promise<Either<string, {}>> => {
    let returnValues = {};
    for (let field of fields) {
        if (consoleArguments[field.name] != null) {
            if (field.type == "date" && !isValidDate(consoleArguments[field.name])) {
                return left('Error: Invalid date format. Please enter the date in one of the following formats: ' + supportedDateFormats);
            }
            returnValues[field.name] = consoleArguments[field.name];
        } else {
            let fieldValue = await askUserForFieldValue(field);
            if (fieldValue != null) {
                returnValues[field.name] = fieldValue;
            }
        }
    }
    return right(returnValues);
};