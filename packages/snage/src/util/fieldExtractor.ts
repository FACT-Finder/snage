import {Config, Field} from "../config/type";

export const extractFieldsFromFileName = (config: Config): Field[] => {
    const regex = /\${(\w+)}/g;
    const fields: Field[] = [];
    for (let match = regex.exec(config.filename); match; match = regex.exec(config.filename)) {
        const field = getFieldByName(config, match[1]);
        if (field != undefined) {
            fields.push(field);
        }
    }
    return fields;
};

const getFieldByName = (config: Config, name: string): Field | undefined => {
    return config.fields.find((field) => field.name === name);
};