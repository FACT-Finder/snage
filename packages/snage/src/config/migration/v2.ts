import {insertBefore, Migration, upsert} from '../migrate';
import {Pair, YAMLMap} from 'yaml/types';
import {createNode} from 'yaml';

export const migrateV2: Migration = (config) => {
    const links = config.get('links', true);
    const text = config.get('fileTemplateText') as string | undefined;
    const note = config.get('note') as YAMLMap;
    const basedir = note.get('basedir') as string;
    const file = note.get('file') as string;
    const template: any = typeof text !== 'undefined' ? {file, text} : {file};

    insertBefore(config, 'note', new Pair('basedir', basedir));
    insertBefore(config, 'note', new Pair('template', createNode(template)));
    if (typeof links !== 'undefined') {
        upsert(config, 'note', new Pair('note', createNode({links})));
    } else {
        config.delete('note');
    }

    config.delete('fileTemplateText');
    config.delete('links');

    return config;
};
