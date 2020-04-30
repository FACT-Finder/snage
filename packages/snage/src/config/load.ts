import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import {parseConfig} from './parser';
import {Config, Field, RawConfig, RawField, RawProvidedField} from './type';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import {pipe} from 'fp-ts/lib/pipeable';
import {getValueProvider} from '../provider/provider';

export const loadConfig = (filePath: string): E.Either<string, Config> => {
    const resolvePath = path.resolve(filePath);
    return pipe(
        E.tryCatch(
            () => fs.readFileSync(resolvePath, 'utf-8'),
            (e) => `Could not read ${resolvePath}: ${e}`
        ),
        E.chain((raw) =>
            E.tryCatch(
                () => YAML.parse(raw),
                (e) => `Could not parse ${resolvePath}: ${e}`
            )
        ),
        E.chain((parsed: any) =>
            pipe(
                parseConfig(parsed),
                E.mapLeft((e) => `Could not parse ${filePath}:\n ${JSON.stringify(e)}`)
            )
        ),
        E.chain((rawConfig) => convert(rawConfig))
    );
};

export const hasProvided = (field: RawField): field is RawProvidedField => typeof field.provided !== 'undefined';

export const convert = (rawConfig: RawConfig): E.Either<string, Config> => {
    return pipe(
        A.array.traverse(E.either)(rawConfig.fields, toField),
        E.map((fields) => ({...rawConfig, fields}))
    );
};

const toField = (field: RawField): E.Either<string, Field> => {
    if (!hasProvided(field)) {
        return E.right(field);
    }
    return pipe(
        getValueProvider(field),
        E.map((valueProvider) => ({...field, provider: valueProvider}))
    );
};

export const loadConfigOrExit = (filePath: string): Config => {
    const configOrError = loadConfig(filePath);
    if (E.isLeft(configOrError)) {
        console.error(configOrError.left);
        return process.exit(1);
    }
    return configOrError.right;
};

export const resolveChangelogDirectory = (config: Config, configFilePath: string): string => {
    const configDir = path.dirname(configFilePath);
    const changelogDir = path.dirname(config.filename);
    return path.isAbsolute(changelogDir) ? changelogDir : path.join(configDir, changelogDir);
};
