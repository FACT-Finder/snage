import moment from 'moment';

/**
 * Creates a current date in the provided
 *
 * @returns the created date
 */
export const getCurrentDateInSupportedFormat = (dateFormat: string): string => {
    return moment().format(dateFormat);
};
