!!! warning
    Queries are highly dependent on your field config,
    everything here is an example and must be adjusted to your config.

    The examples below use our Snage config
    [.snage.yaml](https://github.com/FACT-Finder/snage/blob/master/.snage.yaml)

You can query for all notes belonging to a specific version

```
version = 0.0.7
```

[Try it out](https://changelog.snage.dev/?q=version%3D0.0.7)

or for all notes newer than a specific version

```
version > 0.0.7
```

[Try it out](https://changelog.snage.dev/?q=version%3E0.0.7)

If you want to find all notes between two different versions you have to use the `and` operator to combine two conditions

```
version >= 1.2.7 and version < 2.0.0
```

[Try it out](https://changelog.snage.dev/?q=version%3E%3D0.0.7%20and%20version%20%3C%200.0.10)

## Structure

A simple note query consists either of a field name followed by a binary operator, and a value

```
field binaryOperator value
```

or of a field name followed by a unary operator

```
field unaryOperator
```

### Field

Field may be any field name defined inside your [config](config.md#field).

Our config for Snage has fields like `issue`, `type` and `version`.
Have a look at it here: [snage: ./snage.yaml](https://github.com/FACT-Finder/snage/blob/master/.snage.yaml).

### Operator

#### Unary

Unary operators don't have a value.

| operator | description          | field type      |
| -------- | -------------------- | --------------- |
| absent   | field value is unset | all field types |
| present  | field value is set   | all field types |

#### Binary

Binary operators compare field values of a note with values provided in the query.

| operator | description                       | field type                              |
| -------- | --------------------------------- | --------------------------------------- |
| =        | equal or contains on list         | all field types                         |
| !=       | not equal or not contains on list | all field types                         |
| >        | greater                           | `date`, `number`, `semver`, `ffversion` |
| >=       | greater or equal                  | `date`, `number`, `semver`, `ffversion` |
| <        | less                              | `date`, `number`, `semver`, `ffversion` |
| <=       | less or equal                     | `date`, `number`, `semver`, `ffversion` |
| ~        | string contains                   | `string`                                |
| ~~       | string fuzzy search               | `string`                                |

##### Version comparison

Fields with type `semver` or `ffversion` aren't compared literally, if only part of the version is specified but instead will be seen as range.

For fields with type `semver` the following rules apply:

- `semver = 1` is the same as `semver >= 1.0.0 and semver < 2.0.0`.
- `semver 1.2` is the same as `semver >= 1.2.0 and semver < 1.3.0`.
- `semver = 1.2.3` is compared literally.
- `semver > 1` is compared with minor and patch version implicitly set to 0 `semver > 1.0.0`.

For fields with type `ffversion` the following rules apply:

- `ffversion = 1` is the same as `ffversion >= 1.0.0-0 and ffversion < 2.0.0-0`.
- `ffversion = 1.2` is the same as `ffversion >= 1.2.0-0 and ffversion < 1.3.0-0`.
- `ffversion = 1.2.3` is the same as `ffversion >= 1.2.3-0 and ffversion < 1.2.4-0`.
- `ffversion = 1.2.3-10` is compared literally.
- `ffversion > 1` is compared with minor, patch and prerelease version implicitly set to 0 `ffversion > 1.0.0-0`.

### Value

The value depends on the field type.
When you query a number field, you are only allowed to specify a number.
Other values will result in a query parse error.

### Example

```bash
issue = 50
type = bugfix
date >= 2020-05-05
date absent
issue present
```

## Complex Queries

Simple queries can be combined via logical `and` and logical `or`.

**`and`** requires both its left and right side to evaluate to true.
**`or`** requires either its left or right side to evaluate to true.

```bash
issue = 5 and type = bugfix or type != bugfix
```

### Precedence

`and` takes precendence over `or`, meaning that in a query like

```bash
(type = bugfix and issue = 4) or (type = bugfix and issue = 5)
```

you can omit the parentheses and use

```bash
type = bugfix and issue = 4 or type = bugfix and issue = 5
```

instead.
On the other hand parenthesis around `or` change the meaning of the query, e.g.

```bash
type = bugfix and (issue = 4 or issue = 5)
```

is a different from

```bash
type = bugfix and issue = 4 or issue = 5.
```

## Quoting

String values that contain spaces can be quoted with single or double quotes:

```
content ~ "throw error"
```
