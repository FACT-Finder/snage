/**
 * Creates a current date in the format YYYY-MM-DD
 *
 * @returns a date in the format YYYY-MM-DD
 */
export const getCurrentDateInSupportedFormat = (): string => {
    return new Date().toISOString().slice(0, 10);
};