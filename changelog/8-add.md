---
issue: 8
date: 2020-05-04
type: add
audience: user
components:
  - server
---
# Add provider to fetch version from git tag

You can configure snage to automatically fetch the release version of a
note from a git tag.
Example:
```yaml
- name: version
  type: semver
  provided:
      by: 'git-version'
      arguments:
          version-regex: '^v(.*)$'
```

Snage will look up the commit which introduced the note and use the first
tag which contains this commit. Using `version-regex` snage tries to extract
and parse the version from the tag.

If you explicitly specify a version in the YAML header of the note snage won't
execute the provider.
