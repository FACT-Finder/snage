---
issue: 81
type: fix
audience: user
components:
  - cli
version: 0.0.12
date: 2020-05-25
---

# Correctly parse notes created by `snage create`

`snage create` creates notes which contain unquoted date strings, e.g.

```markdown
---
---
# Summary
```

When trying to parse such a note snage would fail with the following error:
```
$ snage lint
/home/user/src/snage/changelog/81-fix.md: Invalid value "2020-05-20T00:00:00.000Z" supplied to : note/date: YYYY-MM-DD
```

Now snage correctly parses notes with unquoted date strings.
