import yargs from 'yargs';
import {DefaultCli, DefaultSnageConfig, ConfigParameterName, EnvPrefix} from './common';
import {validateFileNameSchema} from '../create/validators';
import {isLeft} from 'fp-ts/lib/Either';
import {addToYargs, buildLogParameters} from '../create/consoleParamsReader';
import {generateChangeLogFile} from '../create/changelogFileWriter';
import {extractFieldsFromFileName} from '../create/genChangelog';
import {loadConfigOrExit, loadConfig} from '../config/load';

// We cannot use yargs.argv because it will abort the building of the parameters.
// Sadly we need the config from the parameters to build the arguments.
// Thus, we manually parse the config parameter.
const uglyGetConfig = (): string => {
    const cfgIdx = process.argv.findIndex((arg) => arg === `--${ConfigParameterName}`);
    if (cfgIdx !== -1 && process.argv.length > cfgIdx + 1) {
        return process.argv[cfgIdx + 1];
    }
    return process.env[`${EnvPrefix}_${ConfigParameterName.toUpperCase()}`] ?? DefaultSnageConfig;
};

export const create: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'create',
    describe: 'Create a change log file.',
    builder: (y) => {
        const config = loadConfig(uglyGetConfig());
        if (isLeft(config)) {
            y.epilog(config.left);
            return y;
        }
        const fileNames: string[] = extractFieldsFromFileName(config.right);
        const fileNameIsValid = validateFileNameSchema(config.right, fileNames);
        if (isLeft(fileNameIsValid)) {
            throw new Error('Validation error: ' + fileNameIsValid);
        }
        return addToYargs(y, config.right) as yargs.Argv<DefaultCli>;
    },
    handler: async ({config: configFile, ...other}) => {
        const config = loadConfigOrExit(configFile);
        const fileNames: string[] = extractFieldsFromFileName(config);
        const fieldValues = await buildLogParameters(config.fields, other, config.supportedDateFormat);

        if (isLeft(fieldValues)) {
            console.error(fieldValues.left);
            process.exit(1);
        }
        const fileStatus = await generateChangeLogFile(fieldValues.right, fileNames, config.filename, config.fileTemplateText);
        if (isLeft(fileStatus)) {
            console.error(fileStatus.left);
            process.exit(1);
        }
        console.log(fileStatus.right);
    },
};
