import {parseFromTimeZone} from 'date-fns-timezone';
import {isValid} from 'date-fns';
import {isValidDate} from './validators';

describe('parseFromTimeZone', () => {
    it('returns invalid date for invalid date strings', () => {
        expect(isValid(parseFromTimeZone('2020-04-x', {timeZone: 'UTC'}))).toBe(false);
    });
    it('isValidDate', () => {
        expect(isValidDate('2020-04-x')).toBe(false);
    });
});
