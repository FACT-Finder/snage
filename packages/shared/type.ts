export interface Note {
    id: string;
    content: string;

    [key: string]: unknown;
}

export interface Config {
    fields: Field[];
    links: Link[];
    filterPresets: FilterPreset[];
    standard: {
        sort: Sort;
        query: string;
    }
    filename: string;
    fileTemplateText: string;
    supportedDateFormats: string[];
}

export interface Field {
    name: string;
    type: 'string' | 'boolean' | 'date' | 'number' | 'semver' | 'ffversion';
    list?: boolean;
    enum?: string[];
    optional?: true;
    description?: string;
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

export const exampleConfig: Config = {
    fields: [
        {name: "issue", type: "string"},
        {name: "type", type: "string", enum: ["bugfix", "feature", "refactoring"]},
        {name: "version", type: "ffversion"},
        {name: "date", type: "date"},
        {name: "audience", type: "string", enum: ["public", "technical", "internal"]},
        {name: "components", type: "string", list: true, enum: ["backend", "ui", "config", "api"], optional: true},
    ],
    filterPresets: [],
    links: [],
    standard: {query: "", sort: {field: 'version', order: 'desc'}},
    filename: "changelog/${issue}.${audience}.md",
    fileTemplateText: "### Release Notes",
    supportedDateFormats: ["YYYY-MM-DD"]
};
