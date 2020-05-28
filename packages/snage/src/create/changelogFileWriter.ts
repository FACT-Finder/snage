import * as fs from 'fs';
import {chain, Either, left, right} from 'fp-ts/lib/Either';
import path from 'path';
import {pipe} from 'fp-ts/lib/pipeable';
import {Field} from '../config/type';
import {FrontMatterBuilder} from './frontMatterBuilder';

export interface FileWriteError {
    msg: string;
}

export const generateChangeLogFile = (
    fieldValues: Record<string, unknown>,
    fields: Field[],
    fieldsForFileName: Field[],
    note: {basedir: string; file: string},
    fileTemplateText: string
): Either<FileWriteError, string> => {
    const content: string = generateFrontMatterFileContent(fieldValues, fields, fileTemplateText);
    const fileName: string = createFileName(fieldValues, fieldsForFileName, note.file);
    const filePath = path.join(note.basedir, fileName);
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

const ensureDirExists = (fileName: string): Either<FileWriteError, true> => {
    try {
        fs.mkdirSync(path.dirname(fileName), {recursive: true});
        return right(true);
    } catch (error) {
        return left({msg: `Error while creating path ${fileName}: ${error}`});
    }
};

const createFile = (filePath: string, content: string): Either<FileWriteError, string> => {
    const createPathResult = ensureDirExists(filePath);
    return pipe(
        createPathResult,
        chain(() => {
            try {
                fs.writeFileSync(filePath, content);
                return right(filePath);
            } catch (error) {
                return left({msg: `Error while writing file: ${error}`});
            }
        })
    );
};
