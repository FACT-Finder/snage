import YAML from "yaml";

export class FrontMatterBuilder {

    content:string;
    header:string;

    constructor() {
        this.content = '';
        this.header = '';
    }

    appendYamlComment(comment: string):FrontMatterBuilder {
        this.header += '#' + comment + '\n';
        return this;
    }

    appendYamlPair(key: string, value: unknown):FrontMatterBuilder {
        const tuple = {};
        tuple[key] = value;
        this.header += YAML.stringify(tuple);
        return this;
    }

    appendContent(content: string):FrontMatterBuilder {
        this.content += content + '\n';
        return this;
    }

    build():string {
        return '---\n' + this.header + '---\n' + this.content.substr(0, this.content.length-1);
    }
}