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
import * as B from 'fp-ts/lib/boolean';
import {identity} from 'fp-ts/lib/function';
import {Config} from '../config/type';
import {convertToApiNote} from '../note/convertapi';

interface Response {
    status: number;
    body: any;
}

export const serve: yargs.CommandModule<DefaultCli, DefaultCli & {port: number}> = {
    command: 'serve',
    builder: (yargs) =>
        yargs
            .number('port')
            .default('port', 8080)
            .describe('port', 'The port snage should listen on'),
    describe: 'Start the snage web server.',
    handler: async ({port}) => {
        return pipe(
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
        )();
    },
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

    app.get('/note', ({query: {query}}, res) => {
        pipe(
            query && query !== '',
            B.fold(
                () => E.right(notes),
                () =>
                    pipe(
                        parser(query),
                        E.bimap(
                            (e): Response => ({status: 400, body: e}),
                            (expression) => {
                                const matcher = createMatcher(expression, config.fields);
                                return notes.filter((note) => matcher(note.values));
                            }
                        )
                    )
            ),
            E.map(A.sort(config.standard.sort)),
            E.map(A.map((note) => convertToApiNote(note, config.fields))),
            E.fold(identity, (notes): Response => ({status: 200, body: notes})),
            ({status, body}) => res.status(status).json(body)
        );
    });
    app.use(express.static(path.join(__dirname, 'ui')));
    app.listen(port, () => console.log(`Listening on ${port}`));
};
