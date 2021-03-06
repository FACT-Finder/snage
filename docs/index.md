<p align="center">
    <a href="https://snage.dev">
        <img height="200px" src="https://snage.dev/logo-text.png" />
    </a>
</p>

[![codecov][codecov-badge]][codecov]
[![build][build-badge]][build]
[![npm][npm-badge]][npm]
[![docker][docker-badge]][docker]
[![aur][aur-badge]][aur]
[![provided][provided-badge]][provided]

## Intro

Your `CHANGELOG.md` doesn't scale with your fancy continuous deployment process 
where you create multiple releases a day? 
Your clients can't find the changes relevant to them? 
Snage solves your problems by creating a searchable changelog 
from markdown documents describing your changes. 
You write one document per change
containing only the gist of what's happened and 
snage does all the rest. 
No more questions about what's changed since version `X.Y.Z`. 
No more merge conflicts.

## Demo/Changelog

Snage uses Snage for its own changelog. Have a look at it on 
[changelog.snage.dev](https://changelog.snage.dev).

## Example Changelog Note

Define your change in markdown with YAML frontmatter.
````
---
issue: 21
date: 2020-04-23
audience: user
type: add
components:
  - cli
version: 0.0.2
---
# Add `snage lint` command

You can lint all change log notes using:
```bash
$ snage lint
```
````
Snage will render it as:

![](https://snage.dev/example.png)

Read more about notes [here](https://snage.dev/note).


## Install

You can install Snage in many different ways:
[Archlinux](https://snage.dev/install/arch), 
[NPM](https://snage.dev/install/npm),
[Yarn](https://snage.dev/install/yarn),
[Docker](https://snage.dev/install/docker) or 
[build Snage manually](https://snage.dev/dev/build).

## Features

* Highly customizable with user defined [fields](https://snage.dev/config/#fields)
* Custom [query language](https://snage.dev/query) for finding change log notes
* Sleek web UI in material ui design
* Great tooling support for managing notes.

## Usage

* `snage serve`: Start the Snage server. [read more](https://snage.dev/cmd/serve)
* `snage create`: Interactively create a new note. [read more](https://snage.dev/cmd/create)
* `snage lint`: Check for errors in notes. [read more](https://snage.dev/cmd/lint)
* `snage set`: Set field values. [read more](https://snage.dev/cmd/set)
* `snage find`: Find notes. [read more](https://snage.dev/cmd/find)
* `snage migrate`: Migrate the `.snage.yaml`. [read more](https://snage.dev/cmd/migrate)

## Contributing

[Setup your development environment](https://snage.dev/dev/setup)


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
