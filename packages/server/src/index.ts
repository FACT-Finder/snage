import express from 'express';
import http from 'http';
import {Config, exampleConfig, Note} from '../../shared/type';
import * as fs from 'fs';
import {parseNote} from './note/parser';
import {createParser} from './query/parser';
import {createMatcher} from './query/match';
import path from 'path';
import {isLeft} from 'fp-ts/lib/Either';

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

export const startServer = ({port}): http.Server => {
    const app = express();
    app.use(express.text({type: '*/*', limit: '10gb'}));
    app.disable('x-powered-by');
    app.use((_, res, next) => {
        res.setHeader('X-Powered-By', 'FACT-Finder Changelog');
        next();
    });

    const config = exampleConfig;
    const parser = createParser(config.fields);

    const notes = parseNotes(config, '../../notes');

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