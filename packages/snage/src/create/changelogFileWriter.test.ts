import {createFileName, generateFrontMatterFileContent} from './changelogFileWriter';
import {Field} from '../config/type';

describe('correctly generate file content', () => {
    const fieldValues: Record<string, unknown> = {};
    fieldValues['Hero'] = 'Batman';
    fieldValues['Sounds'] = ['Zang', 'BAM', 'KLATSCH'];
    fieldValues['Number'] = 42;
    fieldValues['Jingle'] = 'Nananananananana BATMAN';

    const hero: Field = {name: 'Hero', type: 'string'};
    const sounds: Field = {name: 'Sounds', type: 'string', list: true};
    const number: Field = {name: 'Number', type: 'number'};
    const jingle: Field = {name: 'Jingle', type: 'string', optional: true};

    const fields: Field[] = [hero, sounds, number, jingle];
    const text: string = 'Shark repellent bat spray might be situational but still very useful.';

    const fileContent = generateFrontMatterFileContent(fieldValues, fields, text);

    it('correctly generates front matter content for file', () => {
        expect(fileContent).toEqual(
            '---\n' +
                'Hero: Batman\n' +
                'Sounds:\n' +
                '  - Zang\n' +
                '  - BAM\n' +
                '  - KLATSCH\n' +
                'Number: 42\n' +
                'Jingle: Nananananananana BATMAN\n' +
                '---\n' +
                'Shark repellent bat spray might be situational but still very useful.'
        );
    });

    fieldValues['SideKick'] = null;
    fieldValues['AnotherVillain'] = null;

    const sideKick: Field = {name: 'SideKick', type: 'string', optional: true};
    const anotherVillain: Field = {name: 'AnotherVillain', type: 'string'};
    const moreFields: Field[] = [hero, sounds, number, jingle, sideKick, anotherVillain];

    const fileContentWithNulls = generateFrontMatterFileContent(fieldValues, moreFields, text);

    it('correctly generates front matter content for file with null values', () => {
        expect(fileContentWithNulls).toEqual(
            '---\n' +
                'Hero: Batman\n' +
                'Sounds:\n' +
                '  - Zang\n' +
                '  - BAM\n' +
                '  - KLATSCH\n' +
                'Number: 42\n' +
                'Jingle: Nananananananana BATMAN\n' +
                '#AnotherVillain\n' +
                '---\n' +
                'Shark repellent bat spray might be situational but still very useful.'
        );
    });
});

describe('correctly generate file name', () => {
    const fieldValues: Record<string, unknown> = {};
    fieldValues['Hero'] = 'Beastboy';
    fieldValues['Romance'] = 'Terra';

    const hero: Field = {name: 'Hero', type: 'string'};
    const romance: Field = {name: 'Romance', type: 'string'};

    const fields: Field[] = [hero, romance];
    const fileTemplate: string = 'stories/${Hero}-${Romance}.md';

    it('correctly fills in field values into template string', () => {
        expect(createFileName(fieldValues, fields, fileTemplate)).toEqual('stories/Beastboy-Terra.md');
    });
});
