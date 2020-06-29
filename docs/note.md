
A note is the analog of an item in a `CHANGELOG.md`. 
Use it to describe a single change. Add metadata to give context.

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

The header of the notes must start with a YAML front matter block. 
The block starts and ends with a triple-dashed line `---`.
Inside the block you can set values for fields
that are defined inside the [Snage config](config.md#fields).

This examples uses the config we use for the snage changelog
[.snage.yaml](https://github.com/FACT-Finder/snage/blob/master/.snage.yaml).

```yaml
---
issue: 21
date: 2020-04-23
audience: user
type: add
components:
  - cli
version: 0.0.2
---
```

!!! info "Validation"
    Snage checks metadata for invalid values.
    See [`snage lint`](cmd/lint.md).

### 2. Header

After the metadata a markdown header must follow. 
The header is the summary for the whole change log note.

```markdown
# Add `snage-lint` command
```

### 3. Content

The *optional* content should describe the change in more detail.
If present, content and header must be separated by an empty line.
````markdown  hl_lines="2"
# Add `snage lint` command

You can lint all change log notes using:
```bash
$ snage lint
```
````
The content will be interpreted as markdown.

## Best Practices

* Use active language ("Use `ABC` to configure feature X" 
  instead of "Feature X can be configured using `ABC`")
* Use present tense ("Remove support for ..." instead of "Removed support for ...")
* Don't exceed 80 characters in the [header](#2-header)
