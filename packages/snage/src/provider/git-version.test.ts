import {providerFactory} from './git-version';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import semver from 'semver/preload';
import {ValueProvider} from './provider';
import path from 'path';
import {assertRight} from '../fp/fp';

describe('git-version', () => {
    describe('providerFactory', () => {
        it('fails when version-regex is missing', () => {
            const provider: E.Either<string, ValueProvider> = providerFactory({
                name: 'version',
                type: 'semver',
                provided: {
                    by: 'git-version',
                },
            });
            expect(provider).toMatchObject(E.left(`Required argument 'version-regex' is missing.`));
        });
    });
    describe('get', () => {
        it('returns the tag corresponding to the change which added the note', async () => {
            const provider: E.Either<string, ValueProvider> = providerFactory({
                name: 'version',
                type: 'semver',
                provided: {
                    by: 'git-version',
                    arguments: {
                        'version-regex': 'v(.*)',
                    },
                },
            });

            const changelogFile = path.resolve(path.join(__dirname, '../../../../changelog/7-config.md'));
            assertRight(provider);
            const version: TE.TaskEither<string, unknown> = provider.right(changelogFile, [], {});
            expect(await version()).toMatchObject(E.right(semver.parse('0.0.2')));
        });
    });
});
