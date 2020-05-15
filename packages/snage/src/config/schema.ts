import schemaV0 from './schema/v0.json';
import schemaV1 from './schema/v1.json';
import {Document} from 'yaml';
import * as E from 'fp-ts/lib/Either';

export const schema: Record<number, object> = {
    0: schemaV0,
    1: schemaV1,
};

export const currentVersion = 1;
export const currentSchema: object = schema[currentVersion];

export const getSchema = (config: Document): E.Either<string, [number, object]> => {
    const version = config.get('version');
    if (typeof version === 'undefined') {
        return E.right([0, schema[0]]);
    }
    if (typeof version !== 'number') {
        return E.left(`expected 'version' to be a number, got ${typeof version}`);
    }
    if (typeof schema[version] === 'undefined') {
        return E.left(`invalid 'version': expected one of ${Object.keys(schema)}, got ${version}`);
    }
    return E.right([version, schema[version]]);
};
