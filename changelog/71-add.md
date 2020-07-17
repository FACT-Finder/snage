---
type: add
issue: 71
audience: user
components:
  - cli
---
# Add `snage export`

```
$ snage export --help
snage export [condition]

Export notes matching [condition]

Options:
  --version  Show version number                                       [boolean]
  --config   Path to the snage config.         [string] [default: ".snage.yaml"]
  --help     Show help                                                 [boolean]
  --tags     Include note tags                         [boolean] [default: true]

Examples:
  snage  export
  snage  export --no-tags "issue = 21"
```
