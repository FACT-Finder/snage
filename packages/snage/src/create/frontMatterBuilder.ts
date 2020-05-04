import YAML from 'yaml';
import {YAMLMap} from 'yaml/types';

export class FrontMatterBuilder {
    content: string;
    header: YAMLMap;
    comments: string;

    constructor() {
        this.content = '';
        this.header = YAML.createNode({}) as YAMLMap;
        this.comments = '';
    }

    appendYamlComment(comment: string): FrontMatterBuilder {
        this.comments += comment + '\n';
        return this;
    }

    appendYamlPair(key: string, value: unknown): FrontMatterBuilder {
        const node = YAML.createNode(key);
        this.header.set(node, value);
        return this;
    }

    appendContent(content: string): FrontMatterBuilder {
        this.content += content + '\n';
        return this;
    }

    build(): string {
        if (this.comments.length > 0) {
            this.header.comment = this.comments.substr(0, this.comments.length - 1);
        }
        return '---\n' + YAML.stringify(this.header) + '---\n' + this.content.substr(0, this.content.length - 1);
    }
}
