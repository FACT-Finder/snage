---
issue: "#74"
type: add
audience: user
date: '2020-05-15'
components:
  - config
---
# Add `version` field to `.snage.yaml`

A new `version` field now specifies the version of the configuration to allow
snage to read old configuration files. No version implies
```yaml
version: 0
```
