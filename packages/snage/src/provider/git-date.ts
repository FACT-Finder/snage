import {ProviderFactory, requireArgument, ValueProvider} from './provider';
import {Field, FieldValue, RawProvidedField} from '../config/type';
import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import {pipe} from 'fp-ts/lib/function';
import * as TE from 'fp-ts/lib/TaskEither';
import {NoteValues} from '../note/note';
import {tryExec} from './exec';
import path from 'path';
import {extractFieldNamesFromTemplateString} from '../util/fieldExtractor';
import {ConvertField, decodeValue, stringEncodeHeader} from '../note/convert';

export const providerFactory: ProviderFactory = (field: RawProvidedField): E.Either<string, ValueProvider> =>
    pipe(
        requireArgument(field, 'version-tag', 'string'),
        E.map(
            (versionTagTemplate: string) =>
                (file: string, fields: Field[], values: NoteValues): TE.TaskEither<string, FieldValue | undefined> =>
                    getDate(versionTagTemplate, file, fields, values, field)
        )
    );

const getDate = (
    versionTagTemplate: string,
    file: string,
    fields: Field[],
    values: NoteValues,
    field: RawProvidedField
): TE.TaskEither<string, FieldValue | undefined> => {
    const directory = path.dirname(file);
    return pipe(
        getVersionTag(versionTagTemplate, fields, values),
        (tag) => O.option.traverse(TE.taskEither)(tag, extractDate(field, directory)),
        TE.map(O.getOrElse((): FieldValue | undefined => undefined))
    );
};

const getVersionTag = (versionTagTemplate: string, fields: Field[], values: NoteValues): O.Option<string> => {
    const stringValues = stringEncodeHeader(fields, values);
    const fieldNames = extractFieldNamesFromTemplateString(versionTagTemplate);
    return fieldNames.reduce((version, fieldName) => {
        const stringValue = stringValues[fieldName];
        if (typeof stringValue === 'undefined') {
            return O.none;
        }
        if (Array.isArray(stringValue)) {
            throw new Error('Array values may not be used for placeholders');
        }
        return O.option.map(version, (v) => v.replace(`\${${fieldName}}`, stringValue));
    }, O.some(versionTagTemplate));
};

const extractDate =
    (field: ConvertField, directory: string) =>
    (tag: string): TE.TaskEither<string, FieldValue | undefined> =>
        pipe(
            tryExec(`git log -1 --date=short --format=%cd ${tag}`, {cwd: directory}),
            TE.map((date) => date.trim()),
            TE.chainEitherK((date) => E.either.mapLeft(decodeValue(field, date), (errors) => errors.join('\n')))
        );
