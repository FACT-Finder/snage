First [build Snage](build.md) once. Snage consists of two packages:

* `packages/snage`: the command line tool and the server (TypeScript)
* `packages/ui`: the web UI (React)

## Run from source

Start the server and the UI in two terminals:

```bash
$ cd packages/snage && yarn dev-serve
$ cd packages/ui && yarn start
```

Open [http://localhost:3000](http://localhost:3000). Both reload when you
change the code. The server uses Snage's own changelog.
The UI's export button only works with a built server on port 8080.

Run any other command from source with `yarn dev`, e.g.:

```bash
$ cd packages/snage && yarn dev lint
```

## Checks

CI runs these checks for every pull request:

```bash
$ yarn lerna run test
$ yarn lerna run lint-check
$ yarn lerna run format-check
```

`yarn lerna run lint` and `yarn lerna run format` fix most findings.

## Documentation

This documentation lives in `docs/` and needs [Docker](https://www.docker.com/).

```bash
$ yarn docs watch   # preview at http://localhost:9090
$ yarn docs build
```

## Changelog

Snage uses Snage for its own changelog. Add a [note](../note.md) for your
change, e.g. with `yarn dev create` in `packages/snage`.
