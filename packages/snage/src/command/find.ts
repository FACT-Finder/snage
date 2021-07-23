import yargs from 'yargs';
import {DefaultCli, printAndExit} from './common';
import {getConfigOrExit} from '../config/load';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import {pipe} from 'fp-ts/lib/function';
import {parseNotes} from '../note/parser';
import {filterNotes} from '../query/filter';

export const find: yargs.CommandModule<DefaultCli, DefaultCli & {condition?: string}> = {
    command: 'find [condition]',
    describe: 'Find notes matching [condition]',
    builder: (y) => y.example('$0', 'find').example('$0', 'find "issue = 21"'),
    handler: async ({condition = ''}) => {
        const config = getConfigOrExit();
        return pipe(
            parseNotes(config),
            TE.mapLeft((errors) => errors.join('\n')),
            TE.chainEitherK(filterNotes(config, condition)),
            TE.fold(T.fromIOK(printAndExit), (notes) =>
                T.fromIO<void>(() => {
                    notes.forEach((note) => console.log(note.file));
                })
            )
        )();
    },
};
