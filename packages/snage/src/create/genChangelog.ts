import {parseLogParameters} from "./consoleParamsReader";
import {generateChangeLogFile} from "./changelogFileWriter";
import {Config} from "../../../shared/type";
import {validateFileNameSchema} from "./validators";
import {isLeft} from "fp-ts/lib/Either";

const extractFieldsFromFileName = (config: Config): string[] => {
    const regex = /[${][^}]+[}]/g;
    if (config.filename == null) {
        return [];
    }
    const fieldsFoundRaw = config.filename.match(regex);
    const fieldsFound: string[] = [];
    if(fieldsFoundRaw == null) {
        return fieldsFound;
    }
    fieldsFoundRaw.forEach((field) => {
        fieldsFound.push(field.substring(2, field.length - 1));
    });

    return fieldsFound;
};

(async () => {
    console.log("Generating changelog");
    const fileNames: string[] = extractFieldsFromFileName(exampleConfig);
    const fileNameIsValid = validateFileNameSchema(exampleConfig, fileNames);
    if (isLeft(fileNameIsValid)) {
        console.error("Validation error: " + fileNameIsValid);
        return;
    }
    const params = await parseLogParameters(process.argv, exampleConfig);
    if (isLeft(params)) {
        console.error(params.left);
        return;
    }
    const fileStatus = await generateChangeLogFile(params.right, fileNames, exampleConfig.filename, exampleConfig.fileTemplateText);
    if (isLeft(fileStatus)) {
        console.error(fileStatus.left);
        return;
    }
    console.log(fileStatus.right);
})();
