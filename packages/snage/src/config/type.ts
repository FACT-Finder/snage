import semver from 'semver';

export interface Config {
    filename: string;
    fields: Field[];
    links: Link[];
    filterPresets: FilterPreset[];
    standard: {
        sort: Sort;
        query: string;
    };
    fileTemplateText: string;
}

export interface Field {
    name: string;
    type: 'string' | 'boolean' | 'date' | 'number' | 'semver' | 'ffversion';
    list?: boolean;
    enum?: string[];
    optional?: true;
    description?: string;
    alias?: string;
}

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

export type PrimitiveFieldValue = string | number | boolean | semver.SemVer;
export type ArrayFieldValue = PrimitiveFieldValue[];
export type FieldValue = PrimitiveFieldValue | ArrayFieldValue;
