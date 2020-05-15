---
issue: "#74"
type: fix
audience: user
date: "2020-05-15"
components:
  - cli
---
# Put notes created with `snage create` into correct directory

Until now `snage create` has written new notes into a directory relative to its
working directory. Instead `snage` must always interpret the changelog
directory as a relative to the projects' `.snage.yaml`.
