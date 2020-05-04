import yargs from 'yargs';
import {DefaultCli} from './common';
import {isLeft} from 'fp-ts/lib/Either';
import {addToYargs, handleFieldValues} from '../create/consoleParamsReader';
import {generateChangeLogFile} from '../create/changelogFileWriter';
import {getConfig, getConfigOrExit} from '../config/load';
import {extractFieldsFromFileName} from '../util/fieldExtractor';

export const create: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'create',
    describe: 'Create a change log file.',
    builder: (y) => {
        const config = getConfig();
        if (isLeft(config)) {
            y.epilog(config.left);
            return y;
        }
        return addToYargs(y, config.right) as yargs.Argv<DefaultCli>;
    },
    handler: async (args) => {
        const config = getConfigOrExit();
        const fieldsForFileName = extractFieldsFromFileName(config);
        if (isLeft(fieldsForFileName)) {
            console.error(fieldsForFileName.left);
            process.exit(1);
        }
        const fieldValues = await handleFieldValues(config.fields, args);

        if (isLeft(fieldValues)) {
            console.error(fieldValues.left.msg);
            process.exit(1);
        }
        const fileStatus = generateChangeLogFile(fieldValues.right, config.fields, fieldsForFileName.right, config.filename, config.fileTemplateText);
        if (isLeft(fileStatus)) {
            console.error(fileStatus.left.msg);
            process.exit(1);
        }
        console.log(fileStatus.right);
    },
};
