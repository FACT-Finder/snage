---
issue: '#37'
type: add
audience: user
date: '2020-04-27'
components:
  - cli
---
# Allow setting change log field values via `snage set`

```bash
# Set version to 1.0.0 where version is empty
$ snage set --on "version unset" version '1.0.0'

# Set issue to #32 where issue = #33
$ snage set --on "issue = #33" issue "#32"

# Unset field issue
$ snage set issue

# Set components to [cli, server]
$ snage set components cli server
```
