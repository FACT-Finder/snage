import YAML from 'yaml';

export const document = (o: object): YAML.Document => {
    return YAML.parseDocument(YAML.stringify(o));
};
