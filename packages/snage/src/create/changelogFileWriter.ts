import * as fs from 'fs';
import {chain, Either, left, right} from 'fp-ts/lib/Either';
import path from 'path';
import {pipe} from 'fp-ts/lib/pipeable';
import {Field} from '../config/type';
import {FrontMatterBuilder} from './frontMatterBuilder';

export interface FileWriteError {
    msg: string;
}

/**
 * Creates change logs based on the given config in a front matter format. The file type will be MarkDown (.md)
 * and contain a YAML-header with all fields from the config the user provided data for
 *
 * @param fieldValues contains all fieldNames as key with the corresponding value the user provided
 * @param fields used in the config
 * @param fieldsForFileName that should be used to create the file name
 * @param fileNameTemplate that may contains the field placeholders, eg. path/${foo}-${bar}.md
 * @param fileTemplateText represents the placeholder content that is below the front matter header
 *
 * @return an Either with a FileWriteError in left or true in right on success
 */
export const generateChangeLogFile = (
    fieldValues: Record<string, unknown>,
    fields: Field[],
    fieldsForFileName: Field[],
    fileNameTemplate: string,
    fileTemplateText: string
): Either<FileWriteError, boolean> => {
    const content: string = generateFrontMatterFileContent(fieldValues, fields, fileTemplateText);
    const fileName: string = createFileName(fieldValues, fieldsForFileName, fileNameTemplate);

    return createFile(fileName, content);
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

const createFile = (fileName: string, content: string): Either<FileWriteError, boolean> => {
    const createPathResult = ensureDirExists(fileName);
    return pipe(
        createPathResult,
        chain(() => {
            try {
                fs.writeFileSync(fileName, content);
                console.log('Successfully created file: ' + fileName);
                return right(true);
            } catch (error) {
                return left({msg: `Error while writing file: ${error}`});
            }
        })
    );
};
