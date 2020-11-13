---
issue: 7
audience: user
type: add
components:
  - server
version: 0.0.2
date: 2020-04-23
---

# Load and validate configuration from `.snage.yml`

By default snage loads the configuration from `.snage.yml` in the working
directory. You can overwrite the path using the `CONFIG_FILE` environment
variable. Snage validates the configuration against the json schema in
`packages/server/src/config/schema/snage-config.json`.
