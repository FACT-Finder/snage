import {providerFactory} from './git-date';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import semver from 'semver/preload';
import {ValueProvider} from './provider';
import path from 'path';
import {assertRight} from '../fp/fp';
import {LocalDate} from '@js-joda/core';

describe('git-date', () => {
    describe('providerFactory', () => {
        it('fails when version-tag is missing', () => {
            const provider: E.Either<string, ValueProvider> = providerFactory({
                name: 'date',
                type: 'date',
                provided: {
                    by: 'git-date',
                },
            });
            expect(provider).toMatchObject(E.left(`Required argument 'version-tag' is missing.`));
        });
    });
    describe('run without version', () => {
        it('returns undefined', async () => {
            const provider: E.Either<string, ValueProvider> = providerFactory({
                name: 'date',
                type: 'date',
                provided: {
                    by: 'git-date',
                    arguments: {
                        'version-tag': 'v${version}',
                    },
                },
            });

            const changelogFile = path.resolve(path.join(__dirname, '../../../../changelog/7-config.md'));
            assertRight(provider);
            const version: TE.TaskEither<string, unknown> = provider.right(changelogFile, [], {});
            expect(await version()).toMatchObject(E.right(undefined));
        });
    });
    describe('run', () => {
        it('returns the date corresponding to the version tag', async () => {
            const provider: E.Either<string, ValueProvider> = providerFactory({
                name: 'date',
                type: 'date',
                provided: {
                    by: 'git-date',
                    arguments: {
                        'version-tag': 'v${version}',
                    },
                },
            });

            const changelogFile = path.resolve(path.join(__dirname, '../../../../changelog/7-config.md'));
            assertRight(provider);
            const version: TE.TaskEither<string, unknown> = provider.right(
                changelogFile,
                [{name: 'version', type: 'semver'}],
                {version: semver.parse('0.0.2')!}
            );
            expect(await version()).toMatchObject(E.right(LocalDate.parse('2020-04-23')));
        });
    });
});
