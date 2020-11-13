---
issue: 8
type: add
audience: user
components:
  - server
  - config
version: 0.4.0
date: 2020-09-25
---

# Add provider to fetch date from git tag

You can configure snage to automatically fetch the commit date of a
note from a git tag.
Example:
```yaml
- name: date
  type: date
  provided:
      by: 'git-date'
      arguments:
          version-tag: 'v${version}'
```

Snage will look up the git tag constructed from the `version-tag` template and
use the date of the corresponding commit as the date of this note.

If you explicitly specify a date in the YAML header of the note snage won't
execute the provider.

Snage runs different providers in the order as the corresponding fields appear
in your `.snage.yaml`. If you reference fields in your `version-tag` which also
have a provider you have to make sure to order the fields accordingly. E.g. if
the `version` field in the example above is provided by the `git-version`
provider it must appear above the `date` field.
