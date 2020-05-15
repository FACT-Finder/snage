import Ajv from 'ajv';
import * as E from 'fp-ts/lib/Either';
import {RawConfig} from './type';
import {pipe} from 'fp-ts/lib/pipeable';
import {currentSchema, currentVersion, getSchema} from './schema';
import {migrate} from './migrate';

const fieldsWithDefaults = {
    fields: [],
    links: [],
    filterPresets: [],
    fileTemplateText: '',
};

export const parseRawConfig = (config: any): E.Either<string, RawConfig> => {
    return pipe(
        config,
        getSchema,
        E.chain(([version, schema]) =>
            pipe(
                validateConfig(schema, config),
                E.map(migrate(version, currentVersion)),
                E.chain((migratedConfig) => validateConfig(currentSchema, migratedConfig))
            )
        ),
        E.map((parsedConfig) => ({...fieldsWithDefaults, ...parsedConfig}))
    );
};

export const validateConfig = (schema: object, config: any): E.Either<string, any> => {
    const ajv = Ajv();
    const validateFunction = ajv.compile(schema);
    const valid = validateFunction(config);
    if (!valid) {
        return E.left(ajv.errorsText(validateFunction.errors));
    }
    return E.right(config);
};
