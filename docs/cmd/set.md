`snage set` changes a field value in many notes at once.

```bash
snage set [--on <query>] <field> [value..]
```

Snage updates all notes matching the [query](../query.md) given with `--on`,
or all notes if you leave out `--on`. It prints the path of every changed note.

```bash
# Set the version of all unreleased notes
$ snage set --on "version absent" version 1.0.0

# Move notes from issue 22 to issue 33
$ snage set --on "issue = 22" issue 33

# Replace all values of a list field
$ snage set --on "issue = 33" components cli ui

# Remove the field: pass no value (only for optional fields)
$ snage set --on "issue = 33" components
```

Snage checks the new value against your [field config](../config.md#fields)
and changes nothing if it's invalid.
