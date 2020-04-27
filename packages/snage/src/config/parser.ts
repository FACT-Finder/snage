import Ajv, {ErrorObject} from 'ajv';
import configSchema from './schema/snage-config.json';
import {Either, left, right} from 'fp-ts/lib/Either';
import {Config, Field} from './type';
import {validateFileNameSchema} from "../create/validators";
import {extractFieldsFromFileName} from "../util/fieldExtractor";
import {RawConfig} from './type';

const fieldsWithDefaults = {
    fields: [],
    links: [],
    filterPresets: [],
    fileTemplateText: '',
};

export const parseConfig = (config: any): Either<ErrorObject[], RawConfig> => {
    const ajv = Ajv();
    const validate = ajv.compile(configSchema);
    const valid = validate(config);
    const fileNames: Field[] = extractFieldsFromFileName(config.right);
    const fileNameIsValid = validateFileNameSchema(config.right, fileNames);
    if (!valid) {
        return left(validate.errors as ErrorObject[]);
    }
    if (!fileNameIsValid) {
        //todo fix this mess
        return left({key: "fileTemplateText", dataPath: "", schemaPath: "", message: ""} as unknown as ErrorObject[]);
    }

    return right({...fieldsWithDefaults, ...config});
};
