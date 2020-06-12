import YAML from 'yaml';

export const document = (o: object): YAML.Document => YAML.parseDocument(YAML.stringify(o));
