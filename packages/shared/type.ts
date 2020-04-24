export interface ApiNote {
    id: string;
    content: string;
    summary: string;

    values: {[key: string]: string | string[]};
}

