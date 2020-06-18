import YAML from 'yaml';
import {YAMLMap} from 'yaml/types';
import {YamlFieldValue} from '../note/note';

export class YamlStringBuilder {
    content: string[];
    header: YAMLMap;
    comments: string[];

    constructor() {
        this.content = [];
        this.header = YAML.createNode({}) as YAMLMap;
        this.comments = [];
    }

    appendYamlComment(comment: string): YamlStringBuilder {
        this.comments.push(comment);
        return this;
    }

    appendYamlPair(key: string, value: YamlFieldValue): YamlStringBuilder {
        const node = YAML.createNode(key);
        this.header.set(node, value);
        return this;
    }

    appendContent(content: string): YamlStringBuilder {
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
