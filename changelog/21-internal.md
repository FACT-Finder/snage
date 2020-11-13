---
issue: 21
audience: developer
type: change
components:
  - cli
version: 0.0.2
date: 2020-04-23
---

# Use `yarn dev-serve` and `yarn dev` for developing cli/server

Bundling the snage cli required the change of start scripts inside `packages/snage`.

Start the auto reloading development server with `/.snage.yaml`.
```bash
$ yarn dev-serve
``` 

Use the CLI with:
```bash
$ yarn dev create
$ yarn dev lint
```
