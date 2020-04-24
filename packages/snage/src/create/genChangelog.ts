import {Config} from '../config/type';

export const extractFieldsFromFileName = (config: Config): string[] => {
    const regex = /[${][^}]+[}]/g;
    if (config.filename == null) {
        return [];
    }
    const fieldsFoundRaw = config.filename.match(regex);
    const fieldsFound: string[] = [];
    if (fieldsFoundRaw == null) {
        return fieldsFound;
    }
    fieldsFoundRaw.forEach((field) => {
        fieldsFound.push(field.substring(2, field.length - 1));
    });

    return fieldsFound;
};
