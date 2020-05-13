---
issue: '#65'
type: change
audience: user
date: '2020-05-13'
components:
  - cli
---
# Replace no-wizard with interactive

The `--no-wizard` has been removed from the cli options for `create`. Now there is 
the option `--interactive` that is set by default and can be negated 
by using `--no-interactive`.
