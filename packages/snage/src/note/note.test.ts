import {convertToApiNote, convertField, Note} from './note';
import semver from 'semver/preload';
import {Field} from '../config/type';

describe('convert', () => {
    it('converts whole note', () => {
        const note: Note = {
            content: '',
            id: '',
            file: '',
            summary: '',
            values: {
                version: semver.parse('1.0.5'),
                ffversion: '1.0.5-15',
                date: Date.parse('2020-04-24'),
                bool: true,
                number: 1.53,
                list: [true, false],
            },
        };
        const fields: Field[] = [
            {name: 'version', type: 'semver'},
            {name: 'ffversion', type: 'ffversion'},
            {name: 'date', type: 'date'},
            {name: 'bool', type: 'boolean'},
            {name: 'number', type: 'number'},
            {name: 'list', type: 'boolean', list: true},
        ];

        expect(convertToApiNote(note, fields)).toStrictEqual({
            content: '',
            id: '',
            summary: '',
            values: {
                version: '1.0.5',
                ffversion: '1.0.5-15',
                date: '2020-04-24',
                bool: 'true',
                number: '1.53',
                list: ['true', 'false'],
            },
        });
    });
});

describe('convertField', () => {
    it('converts semver', () => {
        expect(convertField({name: 'version', type: 'semver'}, semver.parse('1.0.5'))).toBe('1.0.5');
    });
    it('converts ffversion', () => {
        expect(convertField({name: 'version', type: 'ffversion'}, '1.0.5-51')).toBe('1.0.5-51');
    });
    it('converts dates', () => {
        expect(convertField({name: 'date', type: 'date'}, Date.parse('2019-05-01T15:35'))).toBe('2019-05-01');
    });
    it('converts boolean', () => {
        expect(convertField({name: 'bool', type: 'boolean'}, true)).toBe('true');
    });
    it('converts number', () => {
        expect(convertField({name: 'number', type: 'number'}, 1.53)).toBe('1.53');
    });
    it('converts string', () => {
        expect(convertField({name: 'string', type: 'string'}, 'test')).toBe('test');
    });
    it('converts list of strings', () => {
        expect(convertField({name: 'string', type: 'boolean', list: true}, [true, false])).toStrictEqual(['true', 'false']);
    });
});
