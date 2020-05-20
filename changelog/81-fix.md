---
issue: 81
type: fix
audience: user
date: 2020-05-20
components:
  - cli
---
# Correctly parse notes created by `snage create`

`snage create` creates notes which contain unquoted date strings, e.g.

```markdown
---
date: 2020-05-20
---
# Summary
```

When trying to parse such a note snage would fail with the following error:
```
$ snage lint
/home/user/src/snage/changelog/81-fix.md: Invalid value "2020-05-20T00:00:00.000Z" supplied to : note/date: YYYY-MM-DD
```

Now snage correctly parses notes with unquoted date strings.
