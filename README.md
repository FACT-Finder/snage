# fact-finder/snage 
[![codecov][codecov-badge]][codecov]
[![build][build-badge]][build]
[![npm][npm-badge]][npm]
[![docker][docker-badge]][docker]
[![aur][aur-badge]][aur]
[![provided][provided-badge]][provided]

## Install

If you're a happy Arch Linux user install `snage` from AUR.
Otherwise install `snage` from NPM, e.g. using

```
$ yarn global add snage
```

Make sure that your `$PATH` environment variable includes the output of

```
$ yarn global bin
```

## Usage
Show all commands using

```
$ snage -h
```

Interactively create a new note using

```
$ snage create
```

Check for errors in all notes with

```
$ snage lint
All good :D
```

Start the snage server with
```
$ snage serve
Listening on 8080
```
, then go to http://localhost:8080 to see your changelog.

For more information see

```
$ snage --help
```

or

```
$ snage COMMAND --help
```

## Development
### Download dependencies

```bash
$ yarn
```

### Run tests

```bash
$ CI=true yarn lerna run test
```

### Create Release

* [Draft a new release on GitHub](https://github.com/FACT-Finder/snage/releases/new)

[build]: https://github.com/FACT-Finder/snage/actions?query=workflow%3A.github%2Fworkflows%2Fbuild.yml
[build-badge]: https://github.com/FACT-Finder/snage/workflows/build/badge.svg?branch=master
[codecov]: https://codecov.io/gh/fact-finder/snage/
[codecov-badge]: https://codecov.io/gh/fact-finder/snage/branch/master/graph/badge.svg
[npm]: https://www.npmjs.com/package/snage
[npm-badge]: https://img.shields.io/npm/dt/snage?label=npm%20downloads
[docker]: https://hub.docker.com/r/snage/snage
[docker-badge]: https://img.shields.io/docker/pulls/snage/snage
[aur]: https://aur.archlinux.org/packages/snage/
[aur-badge]: https://img.shields.io/aur/version/snage?label=aur%3A%20snage
[provided]: https://fact-finder.de
[provided-badge]: https://img.shields.io/badge/provided%20by-FACT--Finder-%23294884
