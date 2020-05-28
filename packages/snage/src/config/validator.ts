import Ajv from 'ajv';
import * as E from 'fp-ts/lib/Either';
import {RawConfig} from './type';
import {pipe} from 'fp-ts/lib/pipeable';
import {currentSchema, currentVersion, getSchema} from './schema';
import {migrate} from './migrate';
import {Document} from 'yaml';

const fieldsWithDefaults = {
    fields: [],
    links: [],
    filterPresets: [],
    fileTemplateText: '',
};

export const parseRawConfig = (yamlDoc: Document): E.Either<string, RawConfig> => {
    return pipe(
        migrateConfig(yamlDoc),
        E.map((parsedConfig) => ({...fieldsWithDefaults, ...parsedConfig.toJSON()}))
    );
};

export const migrateConfig = (yamlDoc: Document): E.Either<string, Document> => {
    return pipe(
        yamlDoc,
        getSchema,
        E.chain(([version, schema]) =>
            pipe(
                validateConfig(schema, yamlDoc),
                E.map(migrate(version, currentVersion)),
                E.chain((migratedYamlDoc) => validateConfig(currentSchema, migratedYamlDoc))
            )
        )
    );
};

export const validateConfig = (schema: object, config: Document): E.Either<string, Document> => {
    const ajv = Ajv();
    const validateFunction = ajv.compile(schema);
    const valid = validateFunction(config.toJSON());
    if (!valid) {
        return E.left(ajv.errorsText(validateFunction.errors));
    }
    return E.right(config);
};