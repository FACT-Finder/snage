import {Note} from './note';
import semver from 'semver/preload';
import {Field} from '../config/type';
import {convertToApiNote} from './convertapi';

describe('convert', () => {
    const note: Note = {
        content: '',
        id: '',
        file: '',
        summary: '',
        values: {
            version: semver.parse('1.0.5')!,
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
    it('api converts whole note', () => {
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
