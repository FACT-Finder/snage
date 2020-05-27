Description about .snage.yaml.

Example config:
```yaml
version: 1
note:
    basedir: changelog
    file: "${issue}-${type}.md"
fields:
    - name: issue
      type: number
    - name: type
      type: string
      enum: [add, change, deprecate, remove, fix, security]
    - name: audience
      type: string
      enum: [user, developer]
    - name: version
      type: semver
      optional: true
      provided:
          by: 'git-version'
          arguments:
              version-regex: '^v(.*)$'
    - name: date
      type: date
    - name: components
      type: string
      list: true
      enum: [server, ui, cli, api, config]
      optional: true
filterPresets: []
links:
  - name: "GitHub#${issue}"
    link: "https://github.com/FACT-Finder/snage/issues/${issue}"
standard:
    query: ""
    sort:
        field: version
        order: desc
```

## Explanation

### `version`

```yaml
version: 1
```


### `note`

```yaml
note:
    basedir: changelog
    file: "${issue}-${type}.md"
```

### `fields`

```yaml
fields:
    - name: issue
      type: number
```

### `filterPresets`

### `links`

### `standard`
