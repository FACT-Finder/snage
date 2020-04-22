import Ajv, {ErrorObject} from 'ajv';
import configSchema from './schema/snage-config.json';
import {Config} from '../../../shared/type';
import {Either, left, right} from 'fp-ts/lib/Either';

const fieldsWithDefaults = {
    fields: [],
    links: [],
    filterPresets: [],
    fileTemplateText: '',
    supportedDateFormat: '',
};

export const parseConfig = (config: any): Either<ErrorObject[], Config> => {
    const ajv = Ajv();
    const validate = ajv.compile(configSchema);
    const valid = validate(config);
    if (!valid) {
        return left(validate.errors as ErrorObject[]);
    }

    return right({...fieldsWithDefaults, ...config} as Config);
};
