import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import {parseConfig} from './parser';
import {Config, Field, hasProvided, RawConfig, RawField} from './type';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import {pipe} from 'fp-ts/lib/pipeable';
import {getValueProvider} from '../provider/provider';
import {getOrdering} from '../query/sort';
import {ConfigParameterName, printAndExit} from '../command/common';
import {flow} from 'fp-ts/lib/function';

export const getConfig = (): E.Either<string, Config> => E.either.chain(getConfigFile(), loadConfig);

export const getConfigOrExit = (): Config => {
    return pipe(
        getConfig(),
        E.getOrElse((err): Config => printAndExit(err)())
    );
};

export const getConfigFile = (): E.Either<string, string> =>
    pipe(
        configPathFromArgs(),
        O.alt(defaultConfigPath()),
        E.fromOption(() => `Could not find snage config. Use --${ConfigParameterName} to specify the config file.`)
    );

const configPathFromArgs = (): O.Option<string> =>
    pipe(
        process.argv,
        A.findIndex((arg) => arg === `--${ConfigParameterName}`),
        O.chain((index) => A.lookup(index + 1, process.argv))
    );

export const defaultConfigPath = (): (() => O.Option<string>) => () =>
    pipe(
        parentDirectories(),
        A.chain((directory) => [path.join(directory, '.snage.yaml'), path.join(directory, '.snage.yml')]),
        A.findFirst<string>(fs.existsSync)
    );

const parentDirectories = (): string[] => {
    const root = path.parse(process.cwd()).root;
    return A.array.unfold(
        O.some(path.resolve('.')),
        flow(
            O.filter<string>(fs.existsSync),
            O.map((dir) => [dir, dir === root ? O.none : O.some(path.resolve(dir, '..'))])
        )
    );
};

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
        E.chain((rawConfig) => convert(rawConfig, filePath))
    );
};

export const convert = (rawConfig: RawConfig, configFilePath: string): E.Either<string, Config> => {
    const changelogDirectory = resolveChangelogDirectory(rawConfig.filename, configFilePath);
    const sortField = rawConfig.fields.find((f) => f.name === rawConfig.standard.sort.field)!;
    const ordering = getOrdering(sortField, rawConfig.standard.sort.order);
    return pipe(
        A.array.traverse(E.either)(rawConfig.fields, toField),
        E.map((fields): Config => ({...rawConfig, changelogDirectory, fields, standard: {sort: ordering}}))
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

const resolveChangelogDirectory = (changelogFilePath: string, configFilePath: string): string => {
    const configDir = path.dirname(configFilePath);
    const changelogDir = path.dirname(changelogFilePath);
    return path.isAbsolute(changelogDir) ? changelogDir : path.join(configDir, changelogDir);
};
