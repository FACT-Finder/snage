import {FrontMatterBuilder} from "./frontMatterBuilder";
import matter from "gray-matter";


describe('generateCorrectFrontMatter', () => {

    const contentToSave: string = "Did you ever hear the Tragedy of Darth Plagueis the Wise?";
    const list: string[] = ["A New Hope", "The Empire Strikes Back", "Return of the Jedi"];
    const listKey: string = "Original Trilogy";
    const bool: boolean = true;
    const boolKey: string = "JarJar sucks";
    const num: number = 2;
    const numKey: string = "Number of Sith";
    const str: string = "Death Star/Planet";
    const strKey: string = "Default Empire Power Fantasy";
    const comment: string = "May the force be with you";

    const frontMatter: string = new FrontMatterBuilder()
        .appendYamlComment(comment)
        .appendYamlPair(numKey, num)
        .appendYamlPair(strKey, str)
        .appendYamlPair(boolKey, bool)
        .appendYamlPair(listKey, list)
        .appendContent(contentToSave)
        .build();
    const {content: content, data} = matter(frontMatter);
    it('frontMatter file has expected content', () => {
        expect(content).toEqual(contentToSave);
    });
    it('has correct values inside', () => {
        expect(data[listKey]).toEqual(list);
        expect(data[boolKey]).toEqual(bool);
        expect(data[numKey]).toEqual(num);
        expect(data[strKey]).toEqual(str);
    });
    const lines: string[] = frontMatter.split('\n');
    it('header is correctly enclosed', () => {
        expect(lines[0]).toEqual('---');
        expect(lines[6 + list.length]).toEqual('---');
    });
    it('header contains comment', () => {
        expect(lines[1]).toEqual('#' + comment);
    });
});
