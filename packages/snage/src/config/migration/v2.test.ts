import {migrate} from '../migrate';
import YAML from 'yaml';

describe('v1 -> v2', () => {
    const migration = migrate(1, 2);
    const rawDocument = `\
version: 1
links:
  - link: Github
    name: Hello
note:
  basedir: changelog
  file: "\${issue}-\${type}.md"
fileTemplateText: |
  # Choose a summarizing headline

  - Don't just copy your commit message (you can, if it's appropriate).
`;
    it('migrates', () => {
        expect(migration(YAML.parseDocument(rawDocument)).toJSON()).toEqual({
            version: 2,
            note: {
                links: [{link: 'Github', name: 'Hello'}],
            },
            template: {
                text: `\
# Choose a summarizing headline

- Don't just copy your commit message (you can, if it's appropriate).
`,
                file: '${issue}-${type}.md',
            },
            basedir: 'changelog',
        });
    });
});
