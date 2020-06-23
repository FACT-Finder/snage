import yargs from 'yargs';
import {DefaultCli, printAndExit} from './common';
import {getConfigOrExit} from '../config/load';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as A from 'fp-ts/lib/Array';
import {pipe} from 'fp-ts/lib/pipeable';
import {exportToString} from '../note/export';
import {parseNotes} from '../note/parser';
import {filterNotes} from '../query/filter';

export const exportCmd: yargs.CommandModule<DefaultCli, DefaultCli & {condition?: string; tags: boolean}> = {
    command: 'export [condition]',
    describe: 'Export notes matching [condition]',
    builder: (y) =>
        y
            .example('$0', 'export')
            .example('$0', 'export --no-tags "issue = 21"')
            .option('tags', {
                boolean: true,
                description: 'Include note tags',
                default: true,
            }),
    handler: async ({condition = '', tags}) => {
        const config = getConfigOrExit();
        return pipe(
            parseNotes(config),
            TE.mapLeft((errors) => errors.join('\n')),
            TE.chainEitherK(filterNotes(config, condition)),
            TE.map(A.sort(config.standard.sort)),
            TE.fold(T.fromIOK(printAndExit), (notes) =>
                T.fromIO<void>(() => {
                    console.log(exportToString(notes, config.fields, {tags}));
                })
            )
        )();
    },
};
