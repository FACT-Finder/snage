import {updateNotes} from './set';
import {Note, NoteValues} from '../note/note';
import {left, right} from 'fp-ts/lib/Either';

const note = (id: string, values: NoteValues): Note => {
    return {file: id, content: '', summary: id, id, values};
};

describe('updateNotes', () => {
    it('should unset issue', () => {
        const result = updateNotes({
            fields: [
                {name: 'issue', type: 'string', optional: true},
                {name: 'bool', type: 'boolean'},
            ],
            condition: '',
            fieldName: 'issue',
            notes: [note('one', {issue: '#31', bool: true})],
            stringValue: [],
        });
        expect(result).toStrictEqual(
            right([
                {
                    file: 'one',
                    content: `---
bool: true
---
# one
`,
                },
            ])
        );
    });
    it('should change issue', () => {
        const result = updateNotes({
            fields: [
                {name: 'issue', type: 'string', optional: true},
                {name: 'bool', type: 'boolean'},
            ],
            condition: '',
            fieldName: 'issue',
            notes: [note('one', {issue: '#31', bool: true})],
            stringValue: ['#22'],
        });
        expect(result).toStrictEqual(
            right([
                {
                    file: 'one',
                    content: `---
issue: '#22'
bool: true
---
# one
`,
                },
            ])
        );
    });
    it('should change on condition', () => {
        const result = updateNotes({
            fields: [
                {name: 'issue', type: 'string', optional: true},
                {name: 'bool', type: 'boolean'},
            ],
            condition: 'bool = false',
            fieldName: 'issue',
            notes: [note('one', {issue: '#31', bool: true}), note('two', {issue: '#33', bool: false}), note('three', {issue: '#2', bool: false})],
            stringValue: ['#22'],
        });
        expect(result).toStrictEqual(
            right([
                {
                    file: 'two',
                    content: `---
issue: '#22'
bool: false
---
# two
`,
                },
                {
                    file: 'three',
                    content: `---
issue: '#22'
bool: false
---
# three
`,
                },
            ])
        );
    });
    it('should change issue (list)', () => {
        const result = updateNotes({
            fields: [
                {name: 'issue', type: 'string', optional: true, list: true},
                {name: 'bool', type: 'boolean'},
            ],
            condition: '',
            fieldName: 'issue',
            notes: [note('one', {issue: ['#31', '#55'], bool: true})],
            stringValue: ['#22', '#1'],
        });
        expect(result).toStrictEqual(
            right([
                {
                    file: 'one',
                    content: `---
issue:
  - '#22'
  - '#1'
bool: true
---
# one
`,
                },
            ])
        );
    });
    it('should fail on multiple values on non list', () => {
        const result = updateNotes({
            fields: [
                {name: 'issue', type: 'string', optional: true},
                {name: 'bool', type: 'boolean'},
            ],
            condition: '',
            fieldName: 'issue',
            notes: [note('one', {issue: '#31', bool: true})],
            stringValue: ['#22', '#34'],
        });
        expect(result).toStrictEqual(left(`Field issue is not a list field. You may only provide one value.`));
    });
    it('should fail on no value on required field', () => {
        const result = updateNotes({
            fields: [
                {name: 'issue', type: 'string'},
                {name: 'bool', type: 'boolean'},
            ],
            condition: '',
            fieldName: 'issue',
            notes: [note('one', {issue: '#31', bool: true})],
            stringValue: [],
        });
        expect(result).toStrictEqual(left(`issue is required but no values were provided.`));
    });
    it('should fail on invalid value', () => {
        const result = updateNotes({
            fields: [
                {name: 'issue', type: 'string'},
                {name: 'bool', type: 'boolean'},
            ],
            condition: '',
            fieldName: 'bool',
            notes: [note('one', {issue: '#31', bool: true})],
            stringValue: ['notvalid'],
        });
        expect(result).toStrictEqual(left(`Invalid value "notvalid" supplied to : boolean`));
    });
    it('should fail on invalid value (list)', () => {
        const result = updateNotes({
            fields: [
                {name: 'issue', type: 'string'},
                {name: 'bool', type: 'boolean', list: true},
            ],
            condition: '',
            fieldName: 'bool',
            notes: [note('one', {issue: '#31', bool: [true]})],
            stringValue: ['true', 'notvalid'],
        });
        expect(result).toStrictEqual(left('Invalid value "notvalid" supplied to : bool/1: boolean'));
    });
    it('should fail on invalid condition', () => {
        const result = updateNotes({
            fields: [
                {name: 'issue', type: 'string'},
                {name: 'bool', type: 'boolean', list: true},
            ],
            condition: 'bool = notfalse',
            fieldName: 'bool',
            notes: [note('one', {issue: '#31', bool: [true]})],
            stringValue: ['true'],
        });
        expect(result).toStrictEqual(
            left(`Invalid expression bool = notfalse {"expected":["'false'","'true'"],"index":{"offset":7,"line":1,"column":8}}`)
        );
    });
});
