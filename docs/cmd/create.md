`snage create` creates a new [note](../note.md). It asks for the value of each
field defined in your [config](../config.md#fields) and then opens the note in
your editor (`$EDITOR`), so you can write the headline and description.

The examples use the fields of the [sample config](../config.md): `issue`,
`audience`, `components` and `type`, the kind of change, e.g. `add` or `fix`.

```bash
$ snage create
? Enter issue (number): 21
? Select type: add
? Select audience: user
...
```

Lines starting with `?` are snage's questions, followed by your answer.

You can also pass values as options. Snage only asks for the missing ones.
Repeat an option to set several values of a list field.

```bash
$ snage create --issue 21 --type add --audience user --components cli --components ui
```

## Where the note is stored

The file name comes from [`template.file`](../config.md#template) inside
[`basedir`](../config.md#basedir), e.g. `changelog/21-add.md`. If that file
exists already, snage appends a number: `changelog/21-add2.md`.
The new note starts with the text from [`template.text`](../config.md#template).

## Options

| Option             | Default | Description                                  |
| ------------------ | ------- | -------------------------------------------- |
| `--<field>`        |         | A value for the field `<field>`.             |
| `--no-interactive` |         | Don't ask for missing values.                |
| `--no-editor`      |         | Don't open the note in your editor.          |

!!! tip
    `snage create --help` lists all fields of your config as options.
