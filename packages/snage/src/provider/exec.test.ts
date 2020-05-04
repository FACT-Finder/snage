import {tryExec} from './exec';
import * as E from 'fp-ts/lib/Either';

describe('tryExec', () => {
    it('fails when command does not exist', async () => {
        expect(await tryExec('notExistingCommand with arguments')()).toMatchObject(E.left({}));
    });

    it('returns stdout of successful command', async () => {
        expect(await tryExec('echo "hello, world"')()).toMatchObject(E.right('hello, world\n'));
    });
});
