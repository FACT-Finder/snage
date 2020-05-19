import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import {parseRawConfig} from './validator';
import {Config, Field, hasProvided, Link, LinkProvider, RawConfig, RawField} from './type';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import {pipe} from 'fp-ts/lib/pipeable';
import {getValueProvider} from '../provider/provider';
import {getOrdering} from '../query/sort';
import {ConfigParameterName, printAndExit} from '../command/common';
import {flow} from 'fp-ts/lib/function';
import {extractFieldNamesFromTemplateString, getFields, replacePlaceholders} from '../util/fieldExtractor';
import {NoteLink} from '../note/note';
import {Either, left, right} from 'fp-ts/lib/Either';

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
        E.chain((yamlConfig) => parseConfig(resolvePath, yamlConfig))
    );
};

export const parseConfig = (filePath: string, yamlConfig: any): E.Either<string, Config> =>
    pipe(
        parseRawConfig(yamlConfig),
        E.mapLeft((e) => `Could not parse ${filePath}:\n ${e}`),
        E.chain((rawConfig) => convert(rawConfig, filePath))
    );

const convert = (rawConfig: RawConfig, configFilePath: string): E.Either<string, Config> => {
    const basedir = resolveBasedir(rawConfig.note.basedir, configFilePath);
    const sortField = rawConfig.fields.find((f) => f.name === rawConfig.standard.sort.field)!;
    const ordering = getOrdering(sortField, rawConfig.standard.sort.order);
    return pipe(
        A.array.traverse(E.either)(rawConfig.fields, toField),
        E.chain((fields) =>
            E.either.map(
                createLinkProvider(fields, rawConfig.links),
                (linkProvider): Config => ({
                    ...rawConfig,
                    note: {basedir: basedir, file: rawConfig.note.file},
                    links: linkProvider,
                    fields,
                    standard: {sort: ordering},
                })
            )
        ),
        E.chain(validateNoteFileTemplate)
    );
};

const createLinkProvider = (fields: Field[], links: Link[]): E.Either<string, LinkProvider> =>
    E.either.map(A.array.traverseWithIndex(E.either)(links, createSingleLinkProvider(fields)), mergeProviders);

const createSingleLinkProvider = (fields: Field[]) => (index: number, link: Link): Either<string, LinkProvider> => {
    const requiredFields = extractFieldNamesFromTemplateString(link.name).concat(extractFieldNamesFromTemplateString(link.link));
    return pipe(
        getFields(fields, requiredFields),
        E.chain(fieldsNot('list')),
        E.bimap(
            (error) => `error in links/${index}: ${error}`,
            (fields): LinkProvider => (values) => {
                if (fields.every((field) => values[field.name] !== undefined)) {
                    return [{href: replacePlaceholders(values, fields, link.link), label: replacePlaceholders(values, fields, link.name)}];
                }
                return [];
            }
        )
    );
};

const mergeProviders = (providers: LinkProvider[]): LinkProvider => (values) =>
    providers.reduce((all: NoteLink[], func: LinkProvider) => [...all, ...func(values)], []);

const toField = (field: RawField): E.Either<string, Field> => {
    if (!hasProvided(field)) {
        return E.right(field);
    }
    return pipe(
        getValueProvider(field),
        E.map((valueProvider) => ({...field, provider: valueProvider}))
    );
};

const resolveBasedir = (basedir: string, configFilePath: string): string => {
    const configDir = path.dirname(configFilePath);
    return path.isAbsolute(basedir) ? basedir : path.join(configDir, basedir);
};

const validateNoteFileTemplate = (config: Config): E.Either<string, Config> => {
    return pipe(
        getFields(config.fields, extractFieldNamesFromTemplateString(config.note.file)),
        E.chain(fieldsNot('optional', 'list')),
        E.bimap(
            (error) => `error in note.file: ${error}`,
            () => config
        )
    );
};
export const fieldsNot = (...checks: Array<'optional' | 'list'>) => (fields: Field[]): Either<string, Field[]> => {
    for (const field of fields) {
        if (checks.includes('optional') && field.optional) {
            return left(`Referenced field '${field.name}' is optional. Only required fields may be used.`);
        }
        if (checks.includes('list') && field.list) {
            return left(`Referenced field '${field.name}' is a list type. Only non list types may be used.`);
        }
    }
    return right(fields);
};
