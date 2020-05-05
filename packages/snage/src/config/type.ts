import semver from 'semver';
import {ValueProvider} from '../provider/provider';
import {Note} from '../note/note';
import * as ORD from 'fp-ts/lib/Ord';

export type Config = {
    filename: string;
    fields: Field[];
    links: Link[];
    filterPresets: FilterPreset[];
    standard: {
        sort: ORD.Ord<Note>;
    };
    fileTemplateText: string;
};

export interface RawConfig {
    filename: string;
    fields: RawField[];
    links: Link[];
    filterPresets: FilterPreset[];
    standard: {
        sort: Sort;
        query: string;
    };
    fileTemplateText: string;
}

export type Field = RawField & {provider?: ValueProvider};

export interface RawField {
    name: string;
    type: FieldType;
    list?: boolean;
    enum?: string[];
    optional?: true;
    provided?: Provider;
    description?: string;
    alias?: string;
}

export type FieldType = 'string' | 'boolean' | 'date' | 'number' | 'semver' | 'ffversion';

type RequiredProperty<T, F extends keyof T> = Omit<T, F> & Required<Pick<T, F>>;
export type RawProvidedField = RequiredProperty<RawField, 'provided'>;

export interface FilterPreset {
    name: string;
    filter: string;
    sort: Sort;
}

export interface Sort {
    field: string;
    order: 'asc' | 'desc';
}

export interface Link {
    name: string;
    link: string;
}

export interface Provider {
    by: string;
    arguments?: Record<string, unknown>;
}

export type PrimitiveFieldValue = string | number | boolean | semver.SemVer;
export type ArrayFieldValue = PrimitiveFieldValue[];
export type FieldValue = PrimitiveFieldValue | ArrayFieldValue;
