import {migrate} from '../migrate';

describe('v1 -> v2', () => {
    const migration = migrate(0, 1);
    it('splits filename into basedir and file', () => {
        expect(
            migration({
                filename: 'changelog/nested/${issue}.md',
            })
        ).toMatchObject({
            note: {
                basedir: 'changelog/nested',
                file: '${issue}.md',
            },
        });
    });
    it('sets version to 1', () => {
        expect(
            migration({
                filename: 'changelog/nested/${issue}.md',
            })
        ).toMatchObject({
            version: 1,
        });
    });
});
