export interface ApiNote {
    id: string;
    content: string;
    summary: string;
    style: Record<string, string>;
    links: ApiNoteLink[];

    values: {[key: string]: string | string[]};
}

export interface ApiNoteLink {
    label: string;
    href: string;
}

