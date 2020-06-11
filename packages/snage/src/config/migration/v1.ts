import path from 'path';
import {Migration, upsert} from '../migrate';
import {Pair} from 'yaml/types';
import {createNode} from 'yaml';

export const migrateV1: Migration = (config) => {
    const filename = config.get('filename') as string;
    const basedir = path.dirname(filename);
    const file = path.basename(filename);
    return upsert(config, 'filename', new Pair('note', createNode({basedir, file})));
};
