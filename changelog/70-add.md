---
issue: 70
type: add
audience: user
date: "2020-05-19"
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
