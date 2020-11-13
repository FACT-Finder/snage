---
issue: 37
audience: user
type: add
components:
  - cli
version: 0.0.7
date: 2020-04-28
---

# Add `snage find <condition>`

You can use `snage find` to find change log notes matching the condition.
```bash
$ snage find "issue = #21"
changelog/21-bundle.md
changelog/21-environment.md
changelog/21-internal.md
changelog/21-lint.md
```
