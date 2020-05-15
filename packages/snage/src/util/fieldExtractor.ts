import {Config, Field} from '../config/type';
import {Either, left, right} from 'fp-ts/lib/Either';

export const extractFieldsFromFileName = (config: Config): Either<string, Field[]> => {
    const regex = /\${(\w+)}/g;
    const fields: Field[] = [];
    for (let match = regex.exec(config.note.file); match; match = regex.exec(config.note.file)) {
        const field = getFieldByName(config, match[1]);
        if (field === undefined) {
            return left(`Referenced field '${match[1]}' does not exist.`);
        }
        fields.push(field);
    }
    return right(fields);
};

const getFieldByName = (config: Config, name: string): Field | undefined => {
    return config.fields.find((field) => field.name === name);
};
