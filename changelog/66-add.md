---
issue: 66
type: add
audience: user
components:
  - cli
version: 0.0.11
date: 2020-05-18
---

# Add `snage create` command

`snage create` creates change log notes. Field values can either 
be added via parameters or will be ask interactively.

The latter can be disabled by adding the `--no-interactive` flag.

Available parameters and descriptions can be shown via `snage create --help`.
