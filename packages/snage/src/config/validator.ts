import Ajv, {ErrorObject} from 'ajv';
import configSchema from './schema/snage-config.json';
import {Either, isLeft, left, right} from 'fp-ts/lib/Either';
import {validateFileNameSchema} from '../create/validators';
import {extractFieldsFromFileName} from '../util/fieldExtractor';
import {RawConfig} from './type';

const fieldsWithDefaults = {
    fields: [],
    links: [],
    filterPresets: [],
    fileTemplateText: '',
};

export interface ConfigValidationError {
    msg: string;
    schemaErrors?: ErrorObject[];
}

export const validateConfig = (config: any): Either<ConfigValidationError, RawConfig> => {
    const ajv = Ajv();
    const validate = ajv.compile(configSchema);
    const valid = validate(config);
    if (!valid) {
        return left({msg: 'error in config schema', schemaErrors: validate.errors as ErrorObject[]});
    }
    const fieldsForName = extractFieldsFromFileName(config);
    if (isLeft(fieldsForName)) {
        return left({msg: 'error in filename: ' + fieldsForName.left});
    }
    const fileNameIsValid = validateFileNameSchema(config, fieldsForName.right);
    if (isLeft(fileNameIsValid)) {
        return left({msg: 'error in filename: ' + fileNameIsValid.left});
    }

    return right({...fieldsWithDefaults, ...config});
};
