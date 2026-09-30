`snage fill` writes values from [providers](../config.md#providers) into the
note files.

```bash
$ snage fill version date
/home/me/project/changelog/21-add.md
```

Usually snage asks the provider again each time it reads your notes, e.g.
it looks up the version in your git history. `snage fill` saves the value in
the note instead. It only fills in missing values and prints the path of
each note it writes.

That's useful if the provider can't work anymore later, e.g. because you
squash your history or build from a copy without git.
