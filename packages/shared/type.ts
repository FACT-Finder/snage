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

export const exampleConfig: Config = {
    fields: [
        {name: "issue", type: "string", alias: "i", description: "Issue in the project management system, eg FF-15000"},
        {name: "type", type: "string", description: "Type of change done in the issue.", enum: ["bugfix", "feature", "refactoring"]},
        {name: "version", alias: "v", description: "Major version of the changes target.", type: "ffversion"},
        {name: "date", description: "Release date of the change.", type: "date"},
        {name: "audience", description: "Who should be able to see the changes made.", type: "string", enum: ["public", "technical", "internal"]},
        {name: "components", description: "List all components affected by the changes made.", type: "string", list: true, enum: ["backend", "ui", "config", "api"], optional: true},
    ],
    filterPresets: [],
    links: [],
    standard: {query: "", sort: {field: 'version', order: 'desc'}},
    filename: "changelog/${issue}.${audience}.md",
    fileTemplateText: "### Release Notes",
    supportedDateFormat: "YYYY-MM-DD"
};
