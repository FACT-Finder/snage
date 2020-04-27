import yargs from 'yargs';
import {DefaultCli, printAndExit} from './common';
import {loadConfig, resolveChangelogDirectory} from '../config/load';
import {errorToString, parseField, parseNotes} from '../note/parser';
import matter from 'gray-matter';
import fs from 'fs';
import {createParser} from '../query/parser';
import {createMatcher} from '../query/match';
import {pipe} from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/lib/Either';
import * as A from 'fp-ts/lib/Array';
import {convertToYamlValues} from '../note/convertyaml';
import {Note} from '../note/note';
import {Field} from '../config/type';

interface Options {
    fields: Field[];
    condition?: string;
    fieldName: string;
    stringValue: string[];
    notes: Note[];
}

interface FileResult {
    file: string;
    content: string;
}

export const set: yargs.CommandModule<DefaultCli, DefaultCli & {on?: string; field: string; value: string[]}> = {
    command: 'set <field> [value..]',
    describe: 'Set <field> to [value..] if [condition].',
    builder: (y) =>
        y
            .string('on')
            .example('$0', 'set --on "version unset" version 1.0.0')
            .example('$0', 'set --on "issue = #22"   issue "#33"')
            .example('$0', 'set --on "issue = #22"   issue   # unset issue field')
            .describe('on', 'Condition for setting values')
            .positional('field', {type: 'string', describe: 'The field name'})
            .positional('value', {array: true, type: 'string', describe: 'The field values (Empty if unset)'}) as any,
    handler: ({config: configFile, field: fieldName, value: stringValue, on}) => {
        pipe(
            loadConfig(configFile),
            E.chain((config) =>
                pipe(
                    parseNotes(config, resolveChangelogDirectory(config, configFile)),
                    E.mapLeft(errorToString),
                    E.chain((notes) => updateNotes({fields: config.fields, notes, condition: on, stringValue, fieldName}))
                )
            ),
            E.fold(printAndExit, writeNotes)
        );
    },
};

const parseValue = (fields: Field[], fieldName: string, stringValue: string[]): E.Either<string, unknown> => {
    const field = fields.find((field) => field.name === fieldName);
    if (!field) {
        return E.left(`Field ${fieldName} does not exist`);
    }

    if (!field.optional && stringValue.length === 0) {
        return E.left(`${field.name} is required but no values were provided.`);
    }
    if (field.optional && stringValue.length === 0) {
        return E.right(undefined);
    }
    if (!field?.list && stringValue.length > 1) {
        return E.left(`Field ${fieldName} is not a list field. You may only provide one value.`);
    }
    const value = field?.list ? stringValue : stringValue[0];
    return pipe(
        parseField(field, {[fieldName]: value}, false),
        E.bimap(
            (err) => `${value} is not valid: ${JSON.stringify(err)}`,
            (parsed) => parsed[fieldName]
        )
    );
};

export const updateNotes = ({
    fields,
    condition,
    fieldName,
    stringValue,
    notes,
}: Options): E.Either<string, Array<{file: string; content: string}>> => {
    return pipe(
        parseValue(fields, fieldName, stringValue),
        E.chain((value) =>
            pipe(
                //
                filterNotes(condition, fields, notes),
                E.map(A.map(setValue(value, fieldName, fields)))
            )
        )
    );
};

const filterNotes = (condition: string | undefined, fields: Field[], notes: Note[]): E.Either<string, Note[]> => {
    if (!condition) {
        return E.right(notes);
    }

    return pipe(
        createParser(fields)(condition),
        E.bimap(
            (e) => `Invalid expression ${condition} ${JSON.stringify(e)}`,
            (expression) => {
                const matcher = createMatcher(expression, fields);
                return notes.filter((note) => matcher(note.values));
            }
        )
    );
};

const setValue = (value: unknown, fieldName: string, fields: Field[]) => ({file, summary, content, values}): FileResult => {
    const copy = {...values};
    if (value === undefined) {
        delete copy[fieldName];
    } else {
        copy[fieldName] = value;
    }
    const mergedContent = `# ${summary}${content.trim() !== '' ? '\n\n' : ''}${content}`;
    const result = matter.stringify(mergedContent, convertToYamlValues(copy, fields));
    return {file: file, content: result};
};

const writeNotes = (files: FileResult[]): void => {
    const err = files.reduce((hasError, f) => {
        try {
            fs.writeFileSync(f.file, f.content);
            console.log(`${f.file}`);
            return hasError;
        } catch (e) {
            console.error(`Error: ${f.file}: ${e}`);
            return true;
        }
    }, false);
    if (err) {
        console.error('Could not write all files :/');
        process.exit(1);
    }
};
