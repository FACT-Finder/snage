import {YamlStringBuilder} from './yamlStringBuilder';
import {parseRawNote} from '../note/parser';
import {summaryWithContent} from '../note/tostring';

describe('create yaml string', () => {
    const content = 'Did you ever hear the Tragedy of Darth Plagueis the Wise?';
    const summary = 'Star Wars: Episode IV – A New Hope';
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
        .appendContent(summaryWithContent(summary, content))
        .build();
    const {content: parsedContent, summary: parsedSummary, header} = parseRawNote(builder, 'filename');
    it('file has expected content', () => {
        expect(parsedContent).toEqual(content);
        expect(parsedSummary).toEqual(summary);
    });
    it('has correct values inside', () => {
        expect(header[listKey]).toEqual(list);
        expect(header[boolKey]).toEqual(bool);
        expect(header[numKey]).toEqual(num);
        expect(header[strKey]).toEqual(str);
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
