import yargs from 'yargs';
import {askUserForFieldValue} from './consoleWizzard';
import {expectNever} from '../util/util';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import * as T from 'fp-ts/lib/Task';
import * as A from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import * as R from 'fp-ts/lib/Record';
import {Config, Field, FieldValue} from '../config/type';
import {pipe} from 'fp-ts/lib/pipeable';
import {decodeHeader} from '../note/convert';
import {merge, toRecord} from '../fp/fp';
import {NoteValues} from '../note/note';

const INTERACTIVE_LABEL = 'interactive';

const addType = (field: Field, yargs: yargs.Argv) => {
    if (field.list) {
        yargs.array(field.name);
        return;
    }
    switch (field.type) {
        case 'semver': // intentional fallthrough since semver isn't supported by yargs
        case 'date': // intentional fallthrough since date isn't supported by yargs
        case 'ffversion': // intentional fallthrough since ffversion isn't supported by yargs
        case 'string': {
            yargs.string(field.name);
            return;
        }
        case 'boolean': {
            yargs.boolean(field.name);
            return;
        }
        case 'number': {
            yargs.number(field.name);
            return;
        }
        default: {
            expectNever(field.type);
        }
    }
};

const addDescription = (fields: Field[], yargs: yargs.Argv) => {
    const interactiveDescription =
        'Starts a wizard asking for all field values not already added within the call of this script. \n' +
        "Defaults to true, can be called with --no-interactive to prevent the wizard from starting. In this case, all fields you didn't provide a value for" +
        'will have empty values in the generated file. Optional fields will be commented out in the file.';
    const description = fields.reduce((all, field) => ({...all, [field.name]: field.description ?? ''}), {});
    description[INTERACTIVE_LABEL] = interactiveDescription;
    yargs.describe(description);
};

const addAlias = (fields: Field[], yargs: yargs.Argv) => {
    const alias = {};
    fields.filter((field) => field.alias).map((field) => (alias[field.name] = field.alias));
    yargs.alias(alias);
};

export const addToYargs = (builder: yargs.Argv, config: Config): yargs.Argv => {
    builder.boolean(INTERACTIVE_LABEL);
    config.fields.forEach((field) => addType(field, builder));
    addDescription(config.fields, builder);
    addAlias(config.fields, builder);
    return builder;
};

export const handleFieldValues = (fields: Field[], consoleArguments: Record<string, unknown>): TE.TaskEither<string[], NoteValues> => {
    const decoded = decodeHeader(fields, consoleArguments);
    return E.either.traverse(T.task)(decoded, askForMissingValues(fields, consoleArguments));
};

export const askForMissingValues = (fields: Field[], consoleArguments: Record<string, unknown>) => (values: NoteValues): T.Task<NoteValues> => {
    const missingFields = fields.filter((f) => O.isNone(R.lookup(f.name, values)));
    return pipe(
        A.array.traverse(T.taskSeq)(missingFields, (f) => askValue(f, consoleArguments)),
        T.map(A.filterMap((x) => x)),
        T.map((xs) => merge(values, toRecord(xs)))
    );
};

const askValue = (field: Field, consoleArguments: {}): T.Task<O.Option<[string, FieldValue]>> => {
    if (consoleArguments[INTERACTIVE_LABEL] == null || consoleArguments[INTERACTIVE_LABEL]) {
        return pipe(askUserForFieldValue(field), T.map(O.map((v): [string, FieldValue] => [field.name, v])));
    }
    return T.of(O.none);
};
