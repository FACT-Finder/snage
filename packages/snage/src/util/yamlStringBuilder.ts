import YAML from 'yaml';
import {YamlFieldValue} from '../note/note';

export class YamlStringBuilder {
    content: string[];
    header: YAML.YAMLMap;
    comments: string[];

    constructor() {
        this.content = [];
        this.header = new YAML.Document().createNode({}) as YAML.YAMLMap;

        this.comments = [];
    }

    appendYamlComment(comment: string): YamlStringBuilder {
        this.comments.push(comment);
        return this;
    }

    appendYamlPair(key: string, value: YamlFieldValue): YamlStringBuilder {
        this.header.set(key, value);
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
