export interface Note {
    __id: string;
    __content: string;
    __summary: string;

    [key: string]: unknown;
}

export interface Config {
    filename: string;
    fields: Field[];
    links: Link[];
    filterPresets: FilterPreset[];
    standard: {
        sort: Sort;
        query: string;
    }
    fileTemplateText: string;
    supportedDateFormat: string;
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
