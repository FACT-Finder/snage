A note is the analog of an item in a `CHANGELOG.md`.
Use it to describe a single change. Add metadata to give context.
Each note is a markdown file in your [`basedir`](config.md#basedir).
[`snage create`](cmd/create.md) creates one for you.

## Example

````
---
issue: 21
date: 2020-04-23
audience: user
type: add
components:
  - cli
version: 0.0.2
---
# Add `snage lint` command

You can lint all change log notes using:
```bash
$ snage lint
```
````

Want to see more? Have a look at the Snage notes:
[./changelog](https://github.com/FACT-Finder/snage/tree/master/changelog)

## Structure

### 1. Metadata

The note starts with a YAML front matter block between two `---` lines.
It sets values for the [fields in your config](config.md#fields). The example
uses Snage's own config
[.snage.yaml](https://github.com/FACT-Finder/snage/blob/master/.snage.yaml).

You can leave out fields that are [provided](config.md#providers), like
`version` and `date` in Snage's config. Snage fills them in from your git
history.

!!! info "Validation"
    Snage checks metadata for invalid values.
    See [`snage lint`](cmd/lint.md).

### 2. Header

After the metadata a markdown header must follow.
The header is the summary for the whole change log note.

```markdown
# Add `snage lint` command
```

### 3. Content

The *optional* content describes the change in more detail.
Separate it from the header with an empty line.
Snage renders it as markdown.

To link to another note, use its file name as link target,
e.g. `[see the lint note](21-lint.md)`.

## Best Practices

* Write from the audience's point of view, e.g. include the error message
  the user has seen.
* Use active language ("Use `ABC` to configure feature X"
  instead of "Feature X can be configured using `ABC`")
* Use present tense ("Remove support for ..." instead of "Removed support for ...")
* Don't exceed 80 characters in the [header](#2-header)
