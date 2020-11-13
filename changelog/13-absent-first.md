---
issue: 13
type: add
audience: user
components:
  - ui
version: 0.2.0
date: 2020-06-24
---

# Add support for sorting with absent values first or last

```yaml
standard:
  sort:
    field: version
    order: desc
    absent: first
```

`absent: first` sorts notes where `field` is absent to the start ignoring `order`.
