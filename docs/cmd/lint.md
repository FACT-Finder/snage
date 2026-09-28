`snage lint` checks your config and all notes for errors.

```bash
$ snage lint
All good :D
```

It reports, for example:

* notes without YAML front matter or with invalid YAML
* missing values for required fields
* values that don't match the field type or the allowed `enum` values
* errors from [providers](../config.md#providers), e.g. when git isn't available

```bash
$ snage lint
/home/me/project/changelog/21-add.md: Missing value for required field audience
```

Snage exits with status `1` if it finds an error, so you can run
`snage lint` in your CI pipeline to reject invalid notes.
