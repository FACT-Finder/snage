`snage find` prints the paths of all notes that match a [query](../query.md).
Without a query, it prints all notes.

```bash
$ snage find "issue = 21"
/home/me/project/changelog/21-add.md
$ snage find "version absent and audience = user"
/home/me/project/changelog/104-add.md
/home/me/project/changelog/104-change.md
```

Quote the query, so your shell passes it as one argument.

The output works well with other tools, e.g. to open all matching notes:

```bash
$ snage find "version absent" | xargs $EDITOR
```
