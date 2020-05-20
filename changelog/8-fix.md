---
issue: '#8'
type: fix
audience: user
date: 2020-05-05
components:
  - server
---
# Add `git` binary to docker image

Fixes
```
changelog/XX-add.md: field(version): providerError Command failed: git log -n 1 --diff-filter=A --pretty=format:%H -- "XX-add.md"
/bin/sh: git: not found
```
when using the `git-version` provider inside a snage docker container.
