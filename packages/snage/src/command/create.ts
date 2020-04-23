import yargs from 'yargs';
import {DefaultCli} from './common';
import {validateFileNameSchema} from '../create/validators';
import {isLeft} from 'fp-ts/lib/Either';
import {addToYargs, buildLogParameters} from '../create/consoleParamsReader';
import {generateChangeLogFile} from '../create/changelogFileWriter';
import {extractFieldsFromFileName} from '../create/genChangelog';
import {loadConfig} from '../config/load';

export const create: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'create',
    describe: 'Create a change log file.',
    builder: (y) => {
        const {config: configFile} = y.argv;
        const config = loadConfig(configFile);
        const fileNames: string[] = extractFieldsFromFileName(config);
        const fileNameIsValid = validateFileNameSchema(config, fileNames);
        if (isLeft(fileNameIsValid)) {
            throw new Error('Validation error: ' + fileNameIsValid);
        }
        return addToYargs(y, config) as yargs.Argv<DefaultCli>;
    },
    handler: async ({config: configFile, ...other}) => {
        const config = loadConfig(configFile);
        const fileNames: string[] = extractFieldsFromFileName(config);
        const fieldValues = await buildLogParameters(config.fields, other, config.supportedDateFormat);

        if (isLeft(fieldValues)) {
            console.error(fieldValues.left);
            process.exit(1);
            return;
        }
        const fileStatus = await generateChangeLogFile(fieldValues.right, fileNames, config.filename, config.fileTemplateText);
        if (isLeft(fileStatus)) {
            console.error(fileStatus.left);
            process.exit(1);
            return;
        }
        console.log(fileStatus.right);
    },
};
