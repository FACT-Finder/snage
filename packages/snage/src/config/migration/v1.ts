import path from 'path';
import {Migration} from '../migrate';

export const migrateV1: Migration = (v0) => {
    const {filename, ...rest} = v0;
    const basedir = path.dirname(filename as string);
    const file = path.basename(filename as string);
    return {...rest, note: {basedir, file}};
};
