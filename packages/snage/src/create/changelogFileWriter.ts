import * as fs from 'fs';
import {Either, chain, left, right} from 'fp-ts/lib/Either';
import path from 'path';
import {pipe} from 'fp-ts/lib/pipeable';
import {Field} from '../config/type';
import {FieldForOutput} from "./consoleParamsReader";
import YAML from "yaml";
import {FrontMatterBuilder} from "./frontMatterBuilder";

export interface FileWriteError {
    msg: string;
}

/**
 * Creates change logs based on the given config in a front matter format. The file type will be MarkDown (.md)
 * and contain a YAML-header with all fields from the config the user provided data for
 *
 * @param fieldValues contains all fieldNames as key with the corresponding value the user provided
 * @param fields that should be used to create the file name
 * @param fileNameTemplate that may contains the field placeholders, eg. path/${foo}-${bar}.md
 * @param fileTemplateText represents the placeholder content that is below the front matter header
 *
 * @return an Either with a FileWriteError in left or true in right on success
 */
export const generateChangeLogFile = (
    fieldValues: FieldForOutput[],
    fields: Field[],
    fileNameTemplate: string,
    fileTemplateText: string
): Either<FileWriteError, boolean> => {
    const content: string = generateFrontMatterFileContent(fieldValues, fileTemplateText);
    const fileName: string = createFileName(fieldValues, fields, fileNameTemplate);

    return createFile(fileName, content);
};

const generateFrontMatterFileContent = (fieldValues: FieldForOutput[], fileText: string): string => {
    let builder:FrontMatterBuilder = new FrontMatterBuilder();
    fieldValues.forEach(value => {
        if (value.value != null) {
            builder.appendYamlPair(value.name, value.value);
        } else if (!value.optional) {
            builder.appendYamlComment(value.name);
        }
    })
    return builder.appendContent(fileText).build();
};

const createFileName = (fieldValues: FieldForOutput[], fields: Field[], fileNameTemplate: string): string => {
    const values: Record<string, unknown> = {};
    fieldValues.forEach(value => values[value.name] = value.value);
    return fields
        .filter((field) => !field.optional)
        .filter((field) => !field.list)
        .reduce((name, field) => name.replace(`\${${field.name}}`, String(values[field.name])), fileNameTemplate);
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
