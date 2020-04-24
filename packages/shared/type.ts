export interface ApiNote {
    __id: string;
    __content: string;
    __summary: string;

    [key: string]: string | string[];
}

