import {migrate} from '../migrate';
import YAML from 'yaml';
import {currentVersion} from '../schema';

describe(`v0 -> v${currentVersion}`, () => {
    const migration = migrate(0, currentVersion);
    const rawDocument = `\
filename: changelog/\${issue}-\${type}.md
`;
    it('migrates', () => {
        expect(migration(YAML.parseDocument(rawDocument)).toJSON()).toEqual({
            version: currentVersion,
            template: {
                file: '${issue}-${type}.md',
            },
            basedir: 'changelog',
        });
    });
});
