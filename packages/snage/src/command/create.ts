import yargs from 'yargs';
import {DefaultCli} from './common';
import {validateFileNameSchema} from '../create/validators';
import {isLeft} from 'fp-ts/lib/Either';
import {addToYargs, buildLogParameters} from '../create/consoleParamsReader';
import {generateChangeLogFile} from '../create/changelogFileWriter';
import {extractFieldsFromFileName} from '../create/genChangelog';
import {getConfig, getConfigOrExit} from '../config/load';

export const create: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'create',
    describe: 'Create a change log file.',
    builder: (y) => {
        const config = getConfig();
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
    handler: async (args) => {
        const config = getConfigOrExit();
        const fileNames: string[] = extractFieldsFromFileName(config);
        const fieldValues = await buildLogParameters(config.fields, args);

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
