---
issue: 104
type: change
audience: user
components:
  - config
version: 0.1.0
date: 2020-06-12
---

# Add note styling

You can define note styling inside your config.
`css` will be applied to all notes for which the query `on` evaluates to `true`.

**Only the first matching style will be applied.**

```
note:
  styles:
    - on: 'type = add'
      css:
        borderLeft: '10px solid green'
    - on: 'type = fix'
      css:
        borderLeft: '10px solid orange'
```
