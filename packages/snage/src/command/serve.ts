import yargs from 'yargs';
import express from 'express';
import {getConfig} from '../config/load';
import {parseNotes} from '../note/parser';
import {createParser} from '../query/parser';
import {createMatcher} from '../query/match';
import path from 'path';
import {DefaultCli, printAndExit} from './common';
import {Note} from '../note/note';
import {pipe} from 'fp-ts/lib/pipeable';
import * as TE from 'fp-ts/lib/TaskEither';
import * as IO from 'fp-ts/lib/IO';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import {identity} from 'fp-ts/lib/function';
import {Config} from '../config/type';
import {convertToApiNote} from '../note/convertapi';
import {collectDefaultMetrics, register} from 'prom-client';
import {startRequestTimer, totalNotes} from '../util/prometheus';

interface Response {
    status: number;
    body: any;
}

export const serve: yargs.CommandModule<DefaultCli, DefaultCli & {port: number}> = {
    command: 'serve',
    describe: 'Start the snage web server.',
    builder: (yargs) =>
        yargs
            .example('$0', 'serve')
            .example('$0', 'serve --port 12345')
            .number('port')
            .default('port', 8080)
            .describe('port', 'The port snage should listen on'),
    handler: async ({port}) =>
        pipe(
            TE.fromEither(getConfig()),
            TE.chain((config) =>
                pipe(
                    parseNotes(config),
                    TE.bimap(
                        (errors) => errors.join('\n'),
                        (notes) => [config, notes] as [Config, Note[]]
                    )
                )
            ),
            TE.fold(T.fromIOK(printAndExit), T.fromIOK(startExpress(port)))
        )(),
};

export const startExpress = (port: number) => ([config, notes]: [Config, Note[]]): IO.IO<void> => () => {
    const parser = createParser(config.fields);
    const app = express();
    app.use(express.text({type: '*/*', limit: '10gb'}));
    app.disable('x-powered-by');
    app.use((_, res, next) => {
        res.setHeader('X-Powered-By', 'FACT-Finder Changelog');
        next();
    });

    totalNotes.set(notes.length);

    app.get('/note', ({query: {query}}, res) => {
        const endTimer = startRequestTimer('note');
        pipe(
            parser(query),
            E.bimap(
                (e): Response => ({status: 400, body: e}),
                (expression) => {
                    const matcher = createMatcher(expression, config.fields);
                    return notes.filter(matcher);
                }
            ),
            E.map(A.sort(config.standard.sort)),
            E.map(A.map((note) => convertToApiNote(note, config.fields))),
            E.fold(
                identity,
                (notes): Response => ({
                    status: 200,
                    body: {notes, fieldOrder: config.fields.map((f) => f.name)},
                })
            ),
            ({status, body}) => {
                res.status(status).json(body);
                endTimer(status);
            }
        );
    });
    app.use(express.static(path.join(__dirname, 'ui')));
    app.get('/metrics', (req, res) => {
        res.set('Content-Type', register.contentType);
        res.end(register.metrics());
    });
    app.listen(port, () => console.log(`Listening on ${port}`));

    collectDefaultMetrics({prefix: 'snage_'});
};
