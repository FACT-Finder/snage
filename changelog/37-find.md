---
issue: '#37'
date: 2020-04-24
audience: user
type: add
components: [cli]
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
