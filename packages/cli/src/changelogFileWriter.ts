import * as matter from 'gray-matter';
import * as fs from 'fs';
import {Either, isLeft, left, right} from "fp-ts/lib/Either";

/**
 * Creates change logs based on the given config in a front matter format. The file type will be MarkDown (.md)
 * and contain a YAML-header with all fields from the config the user provided data for
 *
 * @param logParameters contains all fieldNames as key with the corresponding value the user provided
 * @param fields that should be used to create the file name
 * @param fileNameTemplate that may contains the field placeholders, eg. path/${foo}-${bar}.md
 * @param fileTemplateText represents the placeholder content that is below the front matter header
 *
 * @return an Either with the file creation error message in left or the success message in right
 */
export const generateChangeLogFile = async (logParameters: {}, fields: string[], fileNameTemplate: string, fileTemplateText: string): Promise<Either<string, string>> => {
    const content: string = matter.stringify(fileTemplateText, logParameters);
    const fileName: string = createFileName(logParameters, fields, fileNameTemplate);

    return createFile(fileName, content);
};

const createFileName = (logParameters: {}, fields: string[], fileNameTemplate: string): string => {
    let fileName: string = fileNameTemplate;
    for (let field of fields) {
        fileName = fileName.split('${' + field + '}').join(logParameters[field])
    }
    return fileName;
};

const makeDirIfNotExisting = async (fileName: string): Promise<Either<string, true>> => {
    const regex = /^.*[\\\/]/;
    const matches = fileName.match(regex);
    if (matches != null && matches.length > 0) {
        await fs.promises.mkdir(matches[0], {recursive: true}).catch(
            function(error) {
                return left("Error while creating path " + matches[0] + ": " + error);
            }
        );
    }
    return right(true);
};

const createFile = async (fileName: string, content: string): Promise<Either<string, string>> => {

    const createPathResult = await makeDirIfNotExisting(fileName);
    if (isLeft(createPathResult)) {
        return left(createPathResult.left);
    }
    await fs.promises.writeFile(fileName, content).catch(
        function(error) {
            return left("Error while writing file: " + error);
        }
    );
    return right("Successfully created file: " + fileName);
};