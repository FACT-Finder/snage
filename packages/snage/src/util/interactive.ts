import * as TE from 'fp-ts/lib/TaskEither';
import * as inquirer from 'inquirer';
import * as A from 'fp-ts/lib/Array';
import * as E from 'fp-ts/lib/Either';
import {Field, FieldValue, PrimitiveFieldValue} from '../config/type';
import {expectNever} from './util';
import {pipe} from 'fp-ts/lib/function';
import {decodeStringValue} from '../note/convert';
import {LocalDate} from '@js-joda/core';
import {assertRight, merge, toRecord} from '../fp/fp';
import {NoteValues} from '../note/note';
import * as O from 'fp-ts/lib/Option';

export const askForMissingValues =
    (fields: Field[]) =>
    (values: NoteValues): TE.TaskEither<string, NoteValues> => {
        const existing = Object.keys(values);
        const missingFields = fields.filter((f) => !existing.includes(f.name) && !f.provided);
        return pipe(
            A.array.traverse(TE.taskEitherSeq)(missingFields, (f) => askValueTuple(f)),
            TE.map(A.filterMap((x) => x)),
            TE.map((xs) => merge(values, toRecord(xs)))
        );
    };

const askValueTuple = (field: Field): TE.TaskEither<string, O.Option<[string, FieldValue]>> =>
    pipe(askValue(field), TE.map(O.map((v) => [field.name, v])));

const askValue = (field: Field): TE.TaskEither<string, O.Option<FieldValue>> => {
    if (field.enum) {
        const choices: Array<Choice<string>> = field.enum.map((value) => ({name: value, value}));
        return askSelect(label(field), choices, field);
    }

    switch (field.type) {
        case 'date':
            return pipe(
                askConfirmation(`Set current date as ${field.name}?`),
                TE.chain((current) =>
                    current
                        ? TE.right(O.some(field.list ? [LocalDate.now()] : LocalDate.now()))
                        : askInputAndParse(label(field, 'YYYY-MM-DD'), validate(field), parse(field))
                )
            );
        case 'semver':
        case 'ffversion':
        case 'string':
        case 'number':
            return askInputAndParse(label(field), validate(field), parse(field));
        case 'boolean':
            const choices: Array<Choice<boolean>> = [
                {name: 'true', value: true},
                {name: 'false', value: false},
            ];
            return askSelect(label(field), choices, field);
        default:
            return expectNever(field.type);
    }
};

const label = ({name, type, list, optional, enum: fenum}: Field, format?: string): string => {
    if (fenum) {
        return `Select ${name}`;
    }

    const flags: string[] = [type];
    if (format) {
        flags.push('format: ' + format);
    }
    if (list) {
        flags.push('separated by comma');
    }

    let prefix = '';
    if (optional) {
        prefix = '[Optional] ';
    }

    return `${prefix}Enter ${name} (${flags.join(', ')}):`;
};

const validate =
    (field: Field) =>
    (value: string): string | boolean => {
        if (value === '') {
            if (field.optional) {
                return true;
            }
            return 'value is required';
        }
        return pipe(
            decodeStringValue(field, field.list ? value.split(',').map((v) => v.trim()) : value),
            E.fold(
                (e) => e.join(', '),
                () => true as string | boolean
            )
        );
    };

const parse =
    (field: Field) =>
    (value: string): O.Option<FieldValue> => {
        if (value === '' && field.optional) {
            return O.none;
        }
        const parsed = decodeStringValue(field, field.list ? value.split(',').map((v) => v.trim()) : value);
        assertRight(parsed);
        return O.some(parsed.right);
    };

const askInputAndParse = (
    message: string,
    validate: (value: string) => string | boolean,
    parser: (value: string) => O.Option<FieldValue>
): TE.TaskEither<string, O.Option<FieldValue>> => TE.taskEither.map(askInput(message, validate), parser);

const askInput = (message: string, validate: (value: string) => string | boolean): TE.TaskEither<string, string> =>
    ask({type: 'input', message, validate});

const askConfirmation = (message: string): TE.TaskEither<string, boolean> => ask({type: 'confirm', message});

const askSelect = <T extends PrimitiveFieldValue>(
    message: string,
    choices: Array<Choice<T>>,
    {list, optional}: {list?: boolean; optional?: boolean}
): TE.TaskEither<string, O.Option<T | T[]>> => {
    if (list) {
        return askMultiSelect(message, choices);
    }
    return askSingleSelect(message, choices, !!optional);
};

const askMultiSelect = <T extends PrimitiveFieldValue>(
    message: string,
    choices: Array<Choice<T>>
): TE.TaskEither<string, O.Option<T[]>> =>
    TE.taskEither.map(ask<T[]>({type: 'checkbox', message, choices}), (value) =>
        value.length === 0 ? O.none : O.some(value)
    );

const NoChoice: Choice<undefined> = {name: '[no value]', value: undefined};

const askSingleSelect = <T>(
    message: string,
    choices: Array<Choice<T>>,
    optional: boolean
): TE.TaskEither<string, O.Option<T>> =>
    TE.taskEither.map(
        ask<T>({type: 'list', message, choices: optional ? A.cons<Choice<T | undefined>>(NoChoice, choices) : choices}),
        O.fromNullable
    );

const ask = <T>(input: Omit<inquirer.QuestionCollection, 'name'>): TE.TaskEither<string, T> =>
    TE.tryCatch(
        () => inquirer.prompt({...input, name: 'value'}).then((x) => x['value']),
        (err) => `Could not ask for input ${err}`
    );

type Choice<T> = {name: string; value: T};
