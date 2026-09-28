You configure Snage using a YAML file. Snage searches for a file named
`.snage.yaml` or `.snage.yml` in the current and all parent directories. You
can specify a different path using `--config <path>`.

Here's a sample configuration with the most important features.
The sections below explain each setting. [`version`](#version),
[`basedir`](#basedir), [`template`](#template) and [`standard`](#standard)
are required, everything else is optional.

```yaml
version: 2
basedir: changelog
template:
  file: ${issue}-${type}.md
  text: |
    # Choose a summarizing headline

    - Don't just copy your commit message (you can, if it's appropriate).
      Instead write the changelog from the audience's point of view, e.g. include the error message the user has seen.
    - Don't write a changelog if the change doesn't affect any of the audiences.
    - Are there multiple changes for different audiences in your PR? Then add multiple changelog notes.
    - Use active language ("Use `ABC` to configure feature X" instead of "Feature X can be configured using `ABC`")
    - Use present tense ("Remove support for ..." instead of "Removed support for ...")
note:
  links:
    - name: "GitHub#${issue}"
      link: "https://github.com/FACT-Finder/snage/issues/${issue}"
  styles:
    - on: 'type = security'
      css:
        borderLeft: '10px solid #e74c3c'
fields:
  - name: issue
    type: number
  - name: type
    type: string
    enum: [ add, change, deprecate, remove, fix, security ]
  - name: audience
    type: string
    enum: [ user, developer ]
    description: The audience affected by the change
  - name: version
    type: semver
    optional: true
    provided:
      by: git-version
      arguments:
        version-regex: '^v(.*)$'
  - name: date
    type: date
    optional: true
    provided:
      by: git-date
      arguments:
        version-tag: 'v${version}'
  - name: components
    type: string
    list: true
    enum: [ server, ui, cli, api, config ]
    optional: true
filterPresets: [] # Not supported yet.
standard:
  query: ""
  sort:
    field: version
    order: desc
    absent: first
```

Snage's own config is a complete, working example:
[.snage.yaml](https://github.com/FACT-Finder/snage/blob/master/.snage.yaml).

## version

`version` is the version of the config format. The current version is `2`.
Snage also reads older versions; [`snage migrate`](cmd/migrate.md) updates
your file.

## basedir

`basedir` is the directory containing your [notes](note.md). Snage uses an
absolute path, e.g. `/home/me/notes`, as it is, and resolves a relative path
from the directory of the config file. Snage reads all files directly inside
this directory, not in subdirectories.

## template

`template` defines new notes created by [`snage create`](cmd/create.md).

| Key    | Description |
| ------ | ----------- |
| `file` | The file name of a new note, relative to `basedir`. `${field}` inserts a field value. Only required fields without `list` may be used. |
| `text` | *Optional.* The initial text below the metadata, e.g. writing guidelines for your authors. |

## note

`note` defines links and styles for the notes in the web UI.

### links

`note.links` adds links to each note, e.g. to its issue or pull request.

| Key    | Description |
| ------ | ----------- |
| `name` | The label of the link. |
| `link` | The URL. |

Both may contain `${field}` placeholders. Snage only shows a link if all
fields it uses have a value. List fields can't be used.

### styles

`note.styles` highlights notes in the web UI. `on` is a [query](query.md), `css`
contains CSS properties in camelCase, e.g. `borderLeft` instead of
`border-left`. Snage applies the first style whose query matches the note.

```yaml
note:
  styles:
    - on: 'type = security'
      css:
        borderLeft: '10px solid #e74c3c'
```

## fields

`fields` defines the fields you can set in the metadata of your notes.

| Key           | Description |
| ------------- | ----------- |
| `name`        | The name used in notes and [queries](query.md). `summary`, `content` and `id` are [built-in fields](query.md#field), don't use them. |
| `type`        | The type of the value, see below. |
| `description` | *Optional.* Shown by `snage create --help`. |
| `optional`    | *Optional.* `true` if notes may leave out this field. Default: `false`. |
| `list`        | *Optional.* `true` if the field has a list of values. Default: `false`. |
| `enum`        | *Optional.* For `string` fields: the allowed values. |
| `provided`    | *Optional.* Let a [provider](#providers) fill in the value. |
| `styles`      | *Optional.* Highlights the value in the web UI. Works like [note styles](#styles). |

Field types:

| Type        | Example value     | Description |
| ----------- | ----------------- | ----------- |
| `string`    | `Some text`       | Any text. |
| `boolean`   | `true`            | `true` or `false`. |
| `number`    | `42`              | Any number. |
| `date`      | `2020-04-23`      | A date in the format `YYYY-MM-DD`. |
| `semver`    | `1.2.3`           | A [semantic version](https://semver.org/). |
| `ffversion` | `1.2.3-4`         | Three numbers, optionally followed by `-` and a build number or `SNAPSHOT`. |

The type defines how notes are sorted and which
[query operators](query.md#operator) you can use, e.g. `version > 1.2` compares
versions, not text.

### Providers

A provider fills in a field value that isn't known when you write the note,
e.g. the version of the release that will include the change. It runs only if
the note has no value for the field. [`snage fill`](cmd/fill.md) saves
provided values in the notes.

Snage has two providers, [`git-version`](#git-version) and
[`git-date`](#git-date). Both read your git history, so snage needs `git` and
the full history. In CI, a shallow clone isn't enough, e.g. run
`git fetch --unshallow`.

#### git-version

`git-version` finds the commit that added the note, then the first git tag
containing that commit. `version-regex` must match the tag and extract the
version with exactly one group. Notes that aren't released yet get no value, so
make the field `optional`.

```yaml
- name: version
  type: semver
  optional: true
  provided:
    by: git-version
    arguments:
      version-regex: '^v(.*)$'
```

#### git-date

`git-date` uses the commit date of a git tag. `version-tag` is the tag name,
usually with the version as placeholder. Define the date field *after* the field
it references, so that its value is known.

```yaml
- name: date
  type: date
  optional: true
  provided:
    by: git-date
    arguments:
      version-tag: 'v${version}'
```

## standard

`standard` sets the default sort order.

| Key           | Description |
| ------------- | ----------- |
| `query`       | Required, but currently not used. Set it to `""`. |
| `sort.field`  | The field to sort notes by, in the web UI and in `snage export`. Must be one of your [fields](#fields). |
| `sort.order`  | `asc` or `desc`. |
| `sort.absent` | *Optional.* `first` or `last`: where notes without a value go. Default: `last`. |

## Not used yet

The config format accepts `filterPresets` and the field option `alias`,
but Snage doesn't use them yet.
