export interface ApiNote {
    id: string;
    content: string;
    summary: string;
    style?: Record<string, string>;
    links: ApiNoteLink[];
    valueStyles: Record<string, Record<string, string>>;

    values: {[key: string]: string | string[]};
}

export interface ApiNoteLink {
    label: string;
    href: string;
}

export interface ApiParseError {
    index: {
        column: number;
        line: number;
        offset: number;
    };
    expected: string[];
}
