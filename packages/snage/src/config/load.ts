import fs from 'fs';
import path from 'path';
import YAML from 'yaml';
import {parseConfig} from './parser';
import {Config} from './type';
import {chain, Either, isLeft, mapLeft, tryCatch} from 'fp-ts/lib/Either';
import {pipe} from 'fp-ts/lib/pipeable';

export const loadConfig = (filePath: string): Either<string, Config> => {
    const resolvePath = path.resolve(filePath);
    return pipe(
        tryCatch(
            () => fs.readFileSync(resolvePath, 'utf-8'),
            (e) => `Could not read ${resolvePath}: ${e}`
        ),
        chain((raw) =>
            tryCatch(
                () => YAML.parse(raw),
                (e) => `Could not parse ${resolvePath}: ${e}`
            )
        ),
        chain((parsed: any) =>
            pipe(
                parseConfig(parsed),
                mapLeft((e) => `Could not parse ${filePath}:\n ${JSON.stringify(e)}`)
            )
        )
    );
};

export const loadConfigOrExit = (filePath: string): Config => {
    const configOrError = loadConfig(filePath);
    if (isLeft(configOrError)) {
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
