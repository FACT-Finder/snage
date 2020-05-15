import {migrateV1} from './migration/v1';
import * as A from 'fp-ts/lib/Array';
import * as R from 'fp-ts/lib/Record';
import * as O from 'fp-ts/lib/Option';
import {pipe} from 'fp-ts/lib/pipeable';

export type Migration = (config: Record<string, unknown>) => Record<string, unknown>;

const migrations: Record<string, Migration> = {
    0: migrateV1,
};

/**
 * @throws if called with invalid schema version numbers
 */
export const migrate = (from: number, to: number) => (config: any): any => {
    return A.range(from, to - 1).reduce((c, version) => ({...getMigration(version)(c), version: version + 1}), config);
};

const getMigration = (from: number): Migration =>
    pipe(
        R.lookup(from.toString(), migrations),
        O.getOrElse(
            (): Migration => {
                throw new Error(`no migration from version ${from} found`);
            }
        )
    );
