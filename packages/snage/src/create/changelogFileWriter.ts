import * as matter from 'gray-matter';
import * as fs from 'fs';
import {Either, chain, left, right} from 'fp-ts/lib/Either';
import {Field} from "../../../shared/type";
import path from "path";
import {pipe} from "fp-ts/lib/pipeable";

export interface FileWriteError {
    msg?: string;
}

/**
 * Creates change logs based on the given config in a front matter format. The file type will be MarkDown (.md)
 * and contain a YAML-header with all fields from the config the user provided data for
 *
 * @param metaValues contains all fieldNames as key with the corresponding value the user provided
 * @param fields that should be used to create the file name
 * @param fileNameTemplate that may contains the field placeholders, eg. path/${foo}-${bar}.md
 * @param fileTemplateText represents the placeholder content that is below the front matter header
 *
 * @return an Either with a FileWriteError in left or true in right on success
 */
export const generateChangeLogFile = (
    metaValues: Record<string, unknown>,
    fields: Field[],
    fileNameTemplate: string,
    fileTemplateText: string
): Either<FileWriteError, boolean> => {
    const content: string = matter.stringify(fileTemplateText, metaValues);
    const fileName: string = createFileName(metaValues, fields, fileNameTemplate);

    return createFile(fileName, content);
};

const createFileName = (metaValues: Record<string, unknown>, fields: Field[], fileNameTemplate: string): string => {
    return fields
        .filter(field => !field.optional)
        .filter(field => !field.list)
        .reduce((name, field) => name.replace(`\${${field.name}}`, metaValues[field.name] as string), fileNameTemplate)
};

const ensureDirExists = (fileName: string): Either<FileWriteError, true> => {
    try {
        fs.mkdirSync(path.dirname(fileName), {recursive: true})
        return right(true);
    } catch(error) {
        return left({msg: `Error while creating path ${fileName}: ${error}`});
    }
};

const createFile = (fileName: string, content: string): Either<FileWriteError, boolean> => {
    const createPathResult = ensureDirExists(fileName);
    return pipe(createPathResult, chain(() => {
        try {
            fs.writeFileSync(fileName, content)
            console.log("Successfully created file: " + fileName);
            return right(true);
        } catch(error) {
            return left({msg: `Error while writing file: ${error}`});
        }
    }))
};
