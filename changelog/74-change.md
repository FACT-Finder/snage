---
issue: "#74"
type: change
audience: user
date: 2020-05-15
components:
  - config
---
# Split `filename` into `note.basedir` and `note.file`

A config containing 
```yaml
version: 0
filename: "changelog/${issue}-${type}.md"
```

should now be rewritten as

```yaml
version: 1
note:
    basedir: "changelog"
    file: "${issue}-${type}.md"
```

The snage commands `serve`, `lint`, `set` and `find` use `note.basedir` to find
the directory containing the notes.  `snage create` uses `note.file` as a
template for the filename of the note it creates.
