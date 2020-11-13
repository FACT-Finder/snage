---
issue: 74
type: add
audience: user
components:
  - config
version: 0.0.11
date: 2020-05-18
---

# Add `version` field to `.snage.yaml`

A new `version` field now specifies the version of the configuration to allow
snage to read old configuration files. No version implies
```yaml
version: 0
```
