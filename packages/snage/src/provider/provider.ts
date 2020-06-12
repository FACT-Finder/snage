import {FieldValue, RawProvidedField} from '../config/type';
import * as E from 'fp-ts/lib/Either';
import * as TE from 'fp-ts/lib/TaskEither';
import {providerFactory as GitVersion} from './git-version';

export interface ValueProvider {
    (file: string): TE.TaskEither<string, FieldValue | undefined>;
}

export interface ProviderFactory {
    (field: RawProvidedField): E.Either<string, ValueProvider>;
}

const providerFactories: Record<string, ProviderFactory> = {
    'git-version': GitVersion,
};

export const getValueProvider = (field: RawProvidedField): E.Either<string, ValueProvider> => {
    const providerFactory = providerFactories[field.provided.by];
    if (typeof providerFactory === 'undefined') {
        return E.left(`unknown provider ${field.provided.by}`);
    }
    return providerFactory(field);
};

export function requireArgument(
    field: RawProvidedField,
    argument: string,
    argumentType: 'string'
): E.Either<string, string>;
export function requireArgument(
    field: RawProvidedField,
    argument: string,
    argumentType: 'number'
): E.Either<string, number>;
export function requireArgument(
    field: RawProvidedField,
    argument: string,
    argumentType: 'boolean'
): E.Either<string, boolean>;
export function requireArgument(
    field: RawProvidedField,
    argument: string,
    argumentType: 'string' | 'number' | 'boolean'
): E.Either<string, unknown> {
    if (typeof field.provided.arguments === 'undefined' || !(argument in field.provided.arguments)) {
        return E.left(`Required argument '${argument}' is missing.`);
    }

    if (typeof field.provided.arguments[argument] !== argumentType) {
        return E.left(
            `wrong argument '${argument}': expected ${argumentType}, got ${typeof field.provided.arguments[argument]}`
        );
    }
    return E.right(field.provided.arguments[argument]);
}
