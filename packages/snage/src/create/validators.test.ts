import {isValidDate} from './validators';

describe('isValidDate', () => {
    it('returns false', () => {
        expect(isValidDate('2020-04-x')).toBe(false);
    });
});
