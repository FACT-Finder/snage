import path from 'path';
import {Migration, upsert} from '../migrate';
import {Pair, Document} from 'yaml';

export const migrateV1: Migration = (config) => {
    const filename = config.get('filename') as string;
    const basedir = path.dirname(filename);
    const file = path.basename(filename);
    return upsert(config, 'filename', new Pair('note', new Document({basedir, file})));
};
