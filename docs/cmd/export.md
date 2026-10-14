`snage export` prints all notes that match a [query](../query.md) as one
markdown document. Without a query, it exports all notes.
Use it, e.g., to write release notes.

```bash
$ snage export "version = 0.0.2" > release-notes.md
```

The notes are sorted like in the web UI
(see [`standard.sort`](../config.md#standard)).
The web UI's export button does the same.

## Options

| Option            | Description                                                         |
| ----------------- | ------------------------------------------------------------------- |
| `--no-tags`       | Leave out the field values (the YAML front matter) of each note.    |
| `--group-by <field>` | Put the notes under one heading per value of `<field>`. List fields can't be used. |

The example below groups the notes of version `0.0.2` by `type`, the kind of
change in the [sample config](../config.md), e.g. `add` or `fix`. Each group
starts with a heading block showing its value, followed by its notes.

```bash
$ snage export --no-tags --group-by type "version = 0.0.2"
##############################
#
# add
#
##############################

# Add `snage lint` command
...
```
