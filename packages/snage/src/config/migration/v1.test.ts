import {migrate} from '../migrate';
import YAML from 'yaml';

describe('v0 -> v1', () => {
    const migration = migrate(0, 1);
    const rawDocument = 'filename: "changelog/nested/${issue}.md"';
    it('splits filename into basedir and file', () => {
        expect(migration(YAML.parseDocument(rawDocument)).toJSON()).toMatchObject({
            note: {
                basedir: 'changelog/nested',
                file: '${issue}.md',
            },
        });
    });
    it('sets version to 1', () => {
        expect(migration(YAML.parseDocument(rawDocument)).toJSON()).toMatchObject({
            version: 1,
        });
    });
});
