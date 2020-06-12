---
issue: 13
type: add
audience: user
date: 2020-05-04
components:
  - ui
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
