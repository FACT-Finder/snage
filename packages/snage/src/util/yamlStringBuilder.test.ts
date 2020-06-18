import {YamlStringBuilder} from './yamlStringBuilder';
import matter from 'gray-matter';

describe('create yaml string', () => {
    const contentToSave = 'Did you ever hear the Tragedy of Darth Plagueis the Wise?';
    const list: string[] = ['A New Hope', 'The Empire Strikes Back', 'Return of the Jedi'];
    const listKey = 'Original Trilogy';
    const bool = true;
    const boolKey = 'JarJar sucks';
    const num = 2;
    const numKey = 'Number of Sith';
    const str = 'Death Star/Planet';
    const strKey = 'Default Empire Power Fantasy';
    const comment = 'May the force be with you';

    const builder: string = new YamlStringBuilder()
        .appendYamlComment(comment)
        .appendYamlPair(numKey, num)
        .appendYamlPair(strKey, str)
        .appendYamlPair(boolKey, bool)
        .appendYamlPair(listKey, list)
        .appendContent(contentToSave)
        .build();
    const {content: content, data} = matter(builder);
    it('file has expected content', () => {
        expect(content).toEqual(contentToSave);
    });
    it('has correct values inside', () => {
        expect(data[listKey]).toEqual(list);
        expect(data[boolKey]).toEqual(bool);
        expect(data[numKey]).toEqual(num);
        expect(data[strKey]).toEqual(str);
    });
    const lines: string[] = builder.split('\n');
    it('header is correctly enclosed', () => {
        expect(lines[0]).toEqual('---');
        expect(lines[6 + list.length]).toEqual('---');
    });
    it('header contains comment', () => {
        expect(lines[8]).toEqual('#' + comment);
    });
});
