import {migrateV1} from './migration/v1';
import * as A from 'fp-ts/lib/Array';
import * as R from 'fp-ts/lib/Record';
import * as O from 'fp-ts/lib/Option';
import {pipe} from 'fp-ts/lib/pipeable';
import {Document} from 'yaml';
import {Pair, YAMLMap} from 'yaml/types';
import {findPair} from 'yaml/util';

export type Migration = (config: YAMLMap) => YAMLMap;

const migrations: Record<string, Migration> = {
    0: migrateV1,
};

/**
 * @throws if called with invalid schema version numbers
 */
export const migrate = (from: number, to: number) => (yamlDoc: Document): Document => {
    if (!(yamlDoc.contents instanceof YAMLMap)) {
        throw new Error(`expected MAP, got ${yamlDoc.contents === null ? 'undefined' : yamlDoc.contents.type}`);
    }
    A.range(from, to - 1).reduce<YAMLMap>((c, version) => setVersion(version + 1, getMigration(version)(c)), yamlDoc.contents as any);
    return yamlDoc;
};

const setVersion = (to: number, contents: YAMLMap): YAMLMap => {
    return upsert(contents, 'version', new Pair('version', to), 0);
};

export const upsert = (contents: YAMLMap, key: any, pair: Pair, defaultIndex: number | undefined = undefined): YAMLMap => {
    const existingPair = findPair(contents.items, key);
    if (typeof existingPair !== 'undefined') {
        existingPair.key = pair.key;
        existingPair.value = pair.value;
    } else {
        if (typeof defaultIndex !== 'undefined') {
            contents.items.splice(defaultIndex, 0, pair);
        } else {
            contents.items.push(pair);
        }
    }
    return contents;
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
