import {Note, partialNote} from './note';
import semver from 'semver/preload';
import {Field} from '../config/type';
import {convertToApiNote} from './convertapi';
import {LocalDate} from '@js-joda/core';

describe('convert', () => {
    const note: Note = partialNote({
        links: [
            {
                label: 'Github',
                href: 'http://github.com',
            },
        ],
        style: {color: 'blue'},
        values: {
            version: semver.parse('1.0.5')!,
            ffversion: '1.0.5-15',
            date: LocalDate.parse('2020-04-24'),
            bool: true,
            number: 1.53,
            list: [true, false],
        },
    });
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
            links: [
                {
                    label: 'Github',
                    href: 'http://github.com',
                },
            ],
            style: {color: 'blue'},
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
