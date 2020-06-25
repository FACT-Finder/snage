import {formatError} from './ErrorTooltip';

describe('format', () => {
    test('format', () => {
        expect(formatError('abcde = cdefg', 6, {})).toEqual(`\
abcde = cdefg
      ^`);
        expect(formatError('0123456789_123456789_123456789_123456789_123456789_', 15, {maxLeft: 30, maxRight: 15}))
            .toEqual(`\
0123456789_123456789_123456789...
               ^`);
        expect(formatError('0123456789_123456789_123456789_123456789_123456789_', 40, {maxLeft: 30, maxRight: 15}))
            .toEqual(`\
..._123456789_123456789_123456789_123456789_
                                 ^`);
        expect(
            formatError('0123456789_123456789_123456789_123456789_123456789_123456789_', 40, {
                maxLeft: 30,
                maxRight: 15,
            })
        ).toEqual(`\
..._123456789_123456789_123456789_123456789_1234...
                                 ^`);
    });
});
