import express from 'express';
import http from 'http';
import {Config, Note} from '../../shared/type';
import * as fs from 'fs';
import {parseNote} from './note/parser';
import {createParser} from './query/parser';
import {createMatcher} from './query/match';
import path from 'path';
import {Either, isLeft} from 'fp-ts/lib/Either';
import YAML from 'yaml';
import {parseConfig} from './config/parser';
import {ErrorObject} from 'ajv';

function handleExitSignal(): void {
    process.exit(1);
}

process.on('SIGINT', handleExitSignal);
process.on('SIGTERM', handleExitSignal);

const parseNotes = (config: Config, folder: string): Note[] => {
    const notes: Note[] = [];
    fs.readdir(folder, (err, files) => {
        if (err) {
            return;
        }
        files.map((file) => {
            const filePath = path.join(folder, file);
            const note = parseNote(config.fields, fs.readFileSync(filePath, 'utf8'));
            if (isLeft(note)) {
                throw new Error(JSON.stringify({...note.left, file: filePath}));
            }
            notes.push(note.right);
        });
    });
    return notes;
};

const loadConfig = (filePath): Config => {
    const rawConfig = fs.readFileSync(filePath, 'utf-8');
    const config: Either<ErrorObject[], Config> = parseConfig(YAML.parse(rawConfig));
    if (isLeft(config)) {
        console.error(`Could not parse ${filePath}:\n ${JSON.stringify(config.left)}`);
        process.exit(1);
    }
    return config.right;
};

const resolveChangelogDirectory = (config: Config, configFilePath: string): string => {
    const configDir = path.dirname(configFilePath);
    const changelogDir = path.dirname(config.filename);
    return path.isAbsolute(changelogDir) ? changelogDir : path.join(configDir, changelogDir);
};

export const startServer = ({port}): http.Server => {
    const app = express();
    app.use(express.text({type: '*/*', limit: '10gb'}));
    app.disable('x-powered-by');
    app.use((_, res, next) => {
        res.setHeader('X-Powered-By', 'FACT-Finder Changelog');
        next();
    });

    const configFilePath = process.env['CONFIG_FILE'] ?? '.snage.yaml';
    const config = loadConfig(configFilePath);

    const changelogDirectory = resolveChangelogDirectory(config, configFilePath);
    const notes = parseNotes(config, changelogDirectory);

    const parser = createParser(config.fields);
    app.get('/note', (req, res) => {
        if (!req.query.query) {
            res.json(notes);
            return;
        }
        const expression = parser(req.query.query);
        if (expression.status) {
            res.json(notes.filter(createMatcher(expression.value, config.fields)));
        } else {
            res.status(400).json(expression);
        }
    });
    app.use(express.static(path.join(__dirname, 'ui')));

    return app.listen(port);
};

startServer({port: 8081});
