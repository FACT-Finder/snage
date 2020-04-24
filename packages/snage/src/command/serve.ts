import yargs from 'yargs';
import express from 'express';
import {loadConfig, resolveChangelogDirectory} from '../config/load';
import {parseNotes} from '../note/parser';
import {createParser} from '../query/parser';
import {createMatcher} from '../query/match';
import path from 'path';
import {DefaultCli} from './common';

export const serve: yargs.CommandModule<DefaultCli, DefaultCli & {port: number}> = {
    command: 'serve',
    builder: (yargs) =>
        yargs
            .number('port')
            .default('port', 8080)
            .describe('port', 'The port snage should listen on'),
    describe: 'Start the snage web server.',
    handler: ({config: configFilePath, port}) => {
        const app = express();
        app.use(express.text({type: '*/*', limit: '10gb'}));
        app.disable('x-powered-by');
        app.use((_, res, next) => {
            res.setHeader('X-Powered-By', 'FACT-Finder Changelog');
            next();
        });

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
        return app.listen(port, () => console.log(`Listening on ${port}`));
    },
};
