---
issue: 74
type: fix
audience: user
components:
  - cli
version: 0.0.11
date: 2020-05-18
---

# Put notes created with `snage create` into correct directory

Until now `snage create` has written new notes into a directory relative to its
working directory. Instead `snage` must always interpret the changelog
directory as a relative to the projects' `.snage.yaml`.
