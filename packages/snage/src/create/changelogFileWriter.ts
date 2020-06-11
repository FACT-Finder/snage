import * as fs from 'fs';
import {chain, Either, left, right} from 'fp-ts/lib/Either';
import path from 'path';
import {pipe} from 'fp-ts/lib/pipeable';
import {Config, Field} from '../config/type';
import {FrontMatterBuilder} from './frontMatterBuilder';

export const generateChangeLogFile = (fieldValues: Record<string, unknown>, config: Config, fieldsForFileName: Field[]): Either<string, string> => {
    const content: string = generateFrontMatterFileContent(fieldValues, config.fields, config.template.text);
    const fileName: string = createFileName(fieldValues, fieldsForFileName, config.template.file);
    const filePath = path.join(config.basedir, fileName);
    return createFile(filePath, content);
};

export const generateFrontMatterFileContent = (fieldValues: Record<string, unknown>, fields: Field[], fileText: string): string => {
    let builder: FrontMatterBuilder = new FrontMatterBuilder();
    fields.forEach((field) => {
        if (field.name in fieldValues) {
            if (fieldValues[field.name] != null) {
                builder.appendYamlPair(field.name, fieldValues[field.name]);
            } else if (!field.optional) {
                builder.appendYamlComment(field.name);
            }
        }
    });
    return builder.appendContent(fileText).build();
};

export const createFileName = (fieldValues: Record<string, unknown>, fields: Field[], fileNameTemplate: string): string => {
    return fields
        .filter((field) => !field.optional)
        .filter((field) => !field.list)
        .reduce((name, field) => name.replace(`\${${field.name}}`, String(fieldValues[field.name])), fileNameTemplate);
};

const ensureDirExists = (fileName: string): Either<string, true> => {
    try {
        fs.mkdirSync(path.dirname(fileName), {recursive: true});
        return right(true);
    } catch (error) {
        return left(`Error while creating path ${fileName}: ${error}`);
    }
};

const createFile = (filePath: string, content: string): Either<string, string> => {
    const createPathResult = ensureDirExists(filePath);
    return pipe(
        createPathResult,
        chain(() => {
            try {
                fs.writeFileSync(filePath, content);
                return right(filePath);
            } catch (error) {
                return left(`Error while writing file: ${error}`);
            }
        })
    );
};
