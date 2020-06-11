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

