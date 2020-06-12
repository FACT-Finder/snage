import semver from 'semver';
import {ValueProvider} from '../provider/provider';
import {Note, NoteLink, NoteValues} from '../note/note';
import * as ORD from 'fp-ts/lib/Ord';
import {LocalDate} from '@js-joda/core';
import {MatcherNote} from '../query/match';

export type Config = {
    basedir: string;
    template: {
        file: string;
        text: string;
    };
    note: {
        styles: CSSProvider;
        links: LinkProvider;
    };
    fields: Field[];
    filterPresets: FilterPreset[];
    standard: {
        sort: ORD.Ord<Note>;
    };
};

export interface LinkProvider {
    (values: NoteValues): NoteLink[];
}

export interface ConditionalStyle {
    on: string;
    css: CSS;
}

export type CSSProvider = (values: MatcherNote) => CSS | undefined;
export type CSS = Record<string, string>;

export interface RawConfig {
    version: number;
    basedir: string;
    template: {
        file: string;
        text: string;
    };
    note: {
        styles: ConditionalStyle[];
        links: Link[];
    };
    fields: RawField[];
    filterPresets: FilterPreset[];
    standard: {
        sort: Sort;
        query: string;
    };
}

export type Field = RawField & {valueProvider?: ValueProvider; styleProvider?: CSSProvider};

export interface RawField {
    name: string;
    type: FieldType;
    list?: boolean;
    enum?: string[];
    optional?: true;
    styles?: ConditionalStyle[];
    provided?: Provider;
    description?: string;
    alias?: string;
}

export type FieldType = 'string' | 'boolean' | 'date' | 'number' | 'semver' | 'ffversion';

type RequiredProperty<T, F extends keyof T> = Omit<T, F> & Required<Pick<T, F>>;
export type RawProvidedField = RequiredProperty<RawField, 'provided'>;
export type ProvidedField = RequiredProperty<Field, 'valueProvider'>;

export const hasProvided = (field: RawField): field is RawProvidedField => typeof field.provided !== 'undefined';
export const hasProvider = (field: Field): field is ProvidedField => typeof field.valueProvider !== 'undefined';

export interface FilterPreset {
    name: string;
    filter: string;
    sort: Sort;
}

export interface Sort {
    field: string;
    order: 'asc' | 'desc';
    absent?: 'first' | 'last';
}

export interface Link {
    name: string;
    link: string;
}

export interface Provider {
    by: string;
    arguments?: Record<string, unknown>;
}

export type PrimitiveFieldValue = string | number | boolean | semver.SemVer | LocalDate;
export type ArrayFieldValue = PrimitiveFieldValue[];
export type FieldValue = PrimitiveFieldValue | ArrayFieldValue;
