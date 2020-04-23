import {Config} from '../../../shared/type';
import fs from 'fs';
import {Either, isLeft} from 'fp-ts/lib/Either';
import {ErrorObject} from 'ajv';
import {parseConfig} from './parser';
import YAML from 'yaml';
import path from 'path';

export const loadConfig = (filePath): Config => {
    const rawConfig = fs.readFileSync(filePath, 'utf-8');
    const config: Either<ErrorObject[], Config> = parseConfig(YAML.parse(rawConfig));
    if (isLeft(config)) {
        console.error(`Could not parse ${filePath}:\n ${JSON.stringify(config.left)}`);
        process.exit(1);
    }
    return config.right;
};

export const resolveChangelogDirectory = (config: Config, configFilePath: string): string => {
    const configDir = path.dirname(configFilePath);
    const changelogDir = path.dirname(config.filename);
    return path.isAbsolute(changelogDir) ? changelogDir : path.join(configDir, changelogDir);
};
