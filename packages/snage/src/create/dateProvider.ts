import {format} from 'date-fns';

export const getCurrentDate = (): string => {
    return format(new Date(), 'yyyy-MM-dd');
};
