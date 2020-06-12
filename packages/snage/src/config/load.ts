import fs from 'fs';
import path from 'path';
import YAML, {Document} from 'yaml';
import {parseRawConfig} from './validator';
import {
    ConditionalStyle,
    Config,
    CSSProvider,
    Field,
    hasProvided,
    Link,
    LinkProvider,
    RawConfig,
    RawField,
} from './type';
import * as E from 'fp-ts/lib/Either';
import {Either, left, right} from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import {pipe} from 'fp-ts/lib/pipeable';
import {getValueProvider} from '../provider/provider';
import {getOrdering} from '../query/sort';
import {ConfigParameterName, printAndExit} from '../command/common';
import {flow} from 'fp-ts/lib/function';
import {extractFieldNamesFromTemplateString, getFields, replacePlaceholders} from '../util/fieldExtractor';
import {NoteLink} from '../note/note';
import {createParser, ParserField} from '../query/parser';
import {createMatcher, MatcherField} from '../query/match';
import {sequenceS} from 'fp-ts/lib/Apply';

export const getConfig = (): E.Either<string, Config> => E.either.chain(getConfigFile(), loadConfig);

export const getConfigOrExit = (): Config =>
    pipe(
        getConfig(),
        E.getOrElse((err): Config => printAndExit(err)())
    );

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
        parseYAMLDocument(resolvePath),
        E.chain((yamlConfig) => parseConfig(resolvePath, yamlConfig))
    );
};

export const parseYAMLDocument = (resolvedPath: string): E.Either<string, Document> =>
    pipe(
        E.tryCatch(
            () => fs.readFileSync(resolvedPath, 'utf-8'),
            (e) => `Could not read ${resolvedPath}: ${e}`
        ),
        E.chain((raw) =>
            E.tryCatch(
                () => YAML.parseDocument(raw),
                (e) => `Could not yaml parse ${resolvedPath}: ${e}`
            )
        )
    );

export const parseConfig = (filePath: string, yamlDoc: Document): E.Either<string, Config> =>
    pipe(
        parseRawConfig(yamlDoc),
        E.mapLeft((e) => `Could not parse ${filePath}:\n ${e}`),
        E.chain((rawConfig) => convert(rawConfig, filePath))
    );

const convert = (rawConfig: RawConfig, configFilePath: string): E.Either<string, Config> => {
    const basedir = resolveBasedir(rawConfig.basedir, configFilePath);
    const sortField = rawConfig.fields.find((f) => f.name === rawConfig.standard.sort.field)!;
    const ordering = getOrdering(sortField, rawConfig.standard.sort.order, rawConfig.standard.sort.absent ?? 'last');
    return pipe(
        A.array.traverse(E.either)(rawConfig.fields, toField(rawConfig.fields)),
        E.chain((fields) =>
            pipe(
                sequenceS(E.either)({
                    links: createLinkProvider(fields, rawConfig.note.links),
                    styles: createStyleProvider(fields, rawConfig.note.styles),
                }),
                E.map(({links, styles}) => ({
                    ...rawConfig,
                    basedir,
                    note: {links, styles},
                    fields,
                    standard: {sort: ordering},
                })),
                E.chain(validateNoteFileTemplate)
            )
        )
    );
};

const createLinkProvider = (fields: Field[], links: Link[]): E.Either<string, LinkProvider> =>
    E.either.map(A.array.traverseWithIndex(E.either)(links, createSingleLinkProvider(fields)), mergeProviders);

const createSingleLinkProvider = (fields: Field[]) => (index: number, link: Link): Either<string, LinkProvider> => {
    const requiredFields = extractFieldNamesFromTemplateString(link.name).concat(
        extractFieldNamesFromTemplateString(link.link)
    );
    return pipe(
        getFields(fields, requiredFields),
        E.chain(fieldsNot('list')),
        E.bimap(
            (error) => `error in links/${index}: ${error}`,
            (fields): LinkProvider => (values) => {
                if (fields.every((field) => values[field.name] !== undefined)) {
                    return [
                        {
                            href: replacePlaceholders(values, fields, link.link),
                            label: replacePlaceholders(values, fields, link.name),
                        },
                    ];
                }
                return [];
            }
        )
    );
};

const createStyleProvider = (
    fields: Array<ParserField & MatcherField>,
    styles: ConditionalStyle[]
): E.Either<string, CSSProvider> => {
    const parser = createParser(fields);

    return pipe(
        A.array.traverse(E.either)(styles, ({on, css}) =>
            E.either.bimap(
                parser(on),
                (e) => `Invalid expression "${on}" ${JSON.stringify(e)}`,
                (expression) => ({matcher: createMatcher(expression, fields), css} as const)
            )
        ),
        E.map((providers): CSSProvider => (values) => providers.find(({matcher}) => matcher(values))?.css)
    );
};

const mergeProviders = (providers: LinkProvider[]): LinkProvider => (values) =>
    providers.reduce((all: NoteLink[], func: LinkProvider) => [...all, ...func(values)], []);

const toField = (fields: RawField[]) => (field: RawField): E.Either<string, Field> => {
    const partial = E.either.map(
        createStyleProvider(fields, field.styles ?? []),
        (styleProvider): Field => ({...field, styleProvider})
    );
    if (!hasProvided(field)) {
        return partial;
    }
    return pipe(
        getValueProvider(field),
        E.chain((valueProvider) => E.either.map(partial, (f) => ({...f, valueProvider})))
    );
};

const resolveBasedir = (basedir: string, configFilePath: string): string => {
    const configDir = path.dirname(configFilePath);
    return path.isAbsolute(basedir) ? basedir : path.join(configDir, basedir);
};

const validateNoteFileTemplate = (config: Config): E.Either<string, Config> =>
    pipe(
        getFields(config.fields, extractFieldNamesFromTemplateString(config.template.file)),
        E.chain(fieldsNot('optional', 'list')),
        E.bimap(
            (error) => `error in note.file: ${error}`,
            () => config
        )
    );
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
