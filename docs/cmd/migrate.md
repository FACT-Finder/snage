`snage migrate` updates your `.snage.yaml` to the current
[config](../config.md) format and saves it in place.

```bash
$ snage migrate
Migrated /home/me/project/.snage.yaml.
```

Snage still reads configs in an older format, it converts them on the fly
every time it starts. Run `snage migrate` once to update the file itself, e.g.
before you use options that only exist in the current format.

!!! tip
    Commit your config before you migrate it, so you can review the changes
    with `git diff`.
