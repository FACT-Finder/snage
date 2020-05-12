import YAML from 'yaml';
import {YAMLMap} from 'yaml/types';

export class FrontMatterBuilder {
    content: string[];
    header: YAMLMap;
    comments: string[];

    constructor() {
        this.content = [];
        this.header = YAML.createNode({}) as YAMLMap;
        this.comments = [];
    }

    appendYamlComment(comment: string): FrontMatterBuilder {
        this.comments.push(comment);
        return this;
    }

    appendYamlPair(key: string, value: unknown): FrontMatterBuilder {
        const node = YAML.createNode(key);
        this.header.set(node, value);
        return this;
    }

    appendContent(content: string): FrontMatterBuilder {
        this.content.push(content);
        return this;
    }

    build(): string {
        if (this.comments.length > 0) {
            this.header.comment = this.comments.join('\n');
        }
        return '---\n' + YAML.stringify(this.header) + '---\n' + this.content.join('\n');
    }
}
