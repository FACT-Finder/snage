import yargs from 'yargs';
import {getConfig} from '../config/load';
import {parseNotes} from '../note/parser';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import {DefaultCli, printAndExit} from './common';
import {pipe} from 'fp-ts/lib/pipeable';

export const lint: yargs.CommandModule<DefaultCli, DefaultCli> = {
    command: 'lint',
    describe: 'Lint all notes.',
    builder: (y) => y.example('$0', 'lint'),
    handler: async () => {
        return pipe(
            TE.fromEither(getConfig()),
            TE.chain((config) =>
                pipe(
                    parseNotes(config),
                    TE.mapLeft((errors) => errors.join('\n'))
                )
            ),
            TE.fold(T.fromIOK(printAndExit), () => T.fromIO(() => console.log('All good :D')))
        )();
    },
};
