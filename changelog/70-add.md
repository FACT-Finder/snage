---
issue: 70
type: add
audience: user
components:
  - ui
  - api
---
# Add note links

Config:
```yml
fields:
  # ...
links:
  - name: Issue#${issue}
    link: https://github.com/FACT-Finder/snage/issues/${issue}
  - name: PR#${pr}
    link: https://github.com/FACT-Finder/snage/pull/${pr}
```
