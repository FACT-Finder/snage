import yargs from 'yargs';
import {DefaultCli} from './common';
import {validateFileNameSchema} from '../create/validators';
import {isLeft} from 'fp-ts/lib/Either';
import {addToYargs, buildLogParameters} from '../create/consoleParamsReader';
import {generateChangeLogFile} from '../create/changelogFileWriter';
import {loadConfig} from '../config/load';
import {Config, Field} from "../../../shared/type";

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
        const fileNames: Field[] = extractFieldsFromFileName(config.right);
        const fileNameIsValid = validateFileNameSchema(config.right, fileNames);
        if (isLeft(fileNameIsValid)) {
            console.error('Validation error: ' + fileNameIsValid);
            process.exit(1)
        }
        return addToYargs(y, config.right) as yargs.Argv<DefaultCli>;
    },
    handler: async (args) => {
        const config = getConfigOrExit();
        const fileNames: Field[] = extractFieldsFromFileName(config);
        const fieldValues = await buildLogParameters(config.fields, args);

        if (isLeft(fieldValues)) {
            console.error(fieldValues.left.msg);
            process.exit(1);
        }
        const fileStatus = await generateChangeLogFile(fieldValues.right, fileNames, config.filename, config.fileTemplateText);
        if (isLeft(fileStatus)) {
            console.error(fileStatus.left.msg);
            process.exit(1);
        }
        console.log(fileStatus.right);
    },
};

const extractFieldsFromFileName = (config: Config): Field[] => {
    const regex = /\${(\w+)}/g;
    const fields: Field[] = [];
    for (let match = regex.exec(config.filename); match; match = regex.exec(config.filename)) {
        const field = getFieldByName(config, match[1]);
        if(field != undefined) {
            fields.push(field);
        }
    }
    return fields;
};

const getFieldByName = (config: Config, name: string): Field | undefined => {
    return config.fields.find(field => field.name === name);
};
