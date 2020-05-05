import {exec, ExecOptions} from 'child_process';
import * as TE from 'fp-ts/lib/TaskEither';
import util from 'util';

const execPromise = util.promisify(exec);

export const tryExec = (command: string, options: ExecOptions = {}): TE.TaskEither<string, string> =>
    TE.tryCatch(
        () => execPromise(command, options).then((result) => result.stdout),
        (reason) => (reason instanceof Error ? reason.message : JSON.stringify(reason))
    );
