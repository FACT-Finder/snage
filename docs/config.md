You configure Snage using a YAML file. Snage searches for a file named
`.snage.yaml` or `.snage.yml` in the current and all parent directories. You
can specify a different path using the `--config` argument or the
`SNAGE_CONFIG` environment variable.

Let's take a quick look at a sample configuration that contains the most
important features.
```yaml
# The version of the configuration format.
version: 2
# The directory containing all the changelog notes. It is relative to the path
# of the `.snage.yaml` it's defined in, except if it's an absolute path
# starting with a slash.
basedir: changelog
template:
  # A template used by `snage create` for the path of new changelog notes. The
  # path is interpreted as relative to `basedir`.
  file: ${issue}-${type}.md
  # A default text for new changelog notes created with `snage create`. It can
  # guide your changelog authors.
  text: |
    # Choose a summarizing headline

    - Don't just copy your commit message (you can, if it's appropriate).
      Instead write the changelog from the audience's point of view, e.g. include the error message the user has seen.
    - Don't write a changelog if the change doesn't affect any of the audiences.
    - Are there multiple changes for different audiences in your PR? Then add multiple changelog notes.
    - Use active language ("Use `ABC` to configure feature X" instead of "Feature X can be configured using `ABC`")
    - Use present tense ("Remove support for ..." instead of "Removed support for ...")
note:
  # Define links from your changelog entry to the corresponding Github issue,
  # pull request or other related information.
  links:
    - name: "GitHub#${issue}"
      link: "https://github.com/FACT-Finder/snage/issues/${issue}"
# Defines the fields for your YAML headers.
fields:
  - name: issue
    # Valid types are string, boolean, date, number, semver and ffversion.
    type: number
  - name: type
    type: string
    # You can restrict string fields to a finite set of values.
    enum: [ add, change, deprecate, remove, fix, security ]
  - name: audience
    type: string
    enum: [ user, developer ]
  - name: version
    type: semver
    # Some fields only make sense for some of your changes. Mark such fields
    # as optional.
    optional: true
    # At the time of writing a new changelog note some values might not be
    # known. E.g. if your continuous integration process creates a new
    #  version after merging your pull request, you don't know the correct
    #  version in advance. In that case you can use the `git-version` provider
    #  which will extract the correct version from your git history when snage
    #  renders your changelog.
    provided:
      by: 'git-version'
      arguments:
        # The regex must match your version tag and have exactly one
        # group extracting the version.
        version-regex: '^v(.*)$'
  - name: date
    type: date
  - name: components
    type: string
    # List fields can have multiple values. In this case a change might touch
    # multiple components.
    list: true
    enum: [ server, ui, cli, api, config ]
    optional: true
filterPresets: []
standard:
  # The default query when opening the snage UI. The empty query shows every
  # changelog entry.
  query: ""
  # The order of the changelog entries in the snage UI.
  sort:
    field: version
    order: desc
```

## Explanation

### `version`

```yaml
version: 1
```


### `note`

```yaml
note:
    basedir: changelog
    file: "${issue}-${type}.md"
```

### `fields`

```yaml
fields:
    - name: issue
      type: number
```

### `filterPresets`

### `links`

### `standard`
