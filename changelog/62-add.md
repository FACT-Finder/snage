---
type: add
issue: 62
audience: user
components:
  - cli
date: 2020-07-22
---
# Add `snage fill [field..]`

```bash
$ snage fill --help
snage fill [field..]

Fill [field..] with values from providers.

Positionals:
  field  The field name                                    [array] [default: []]

Options:
  --version  Show version number                                       [boolean]
  --config   Path to the snage config.         [string] [default: ".snage.yaml"]
  --help     Show help                                                 [boolean]

Examples:
  index.ts  fill version
```
