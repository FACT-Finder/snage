You need [git](https://git-scm.com/), [Node.js](https://nodejs.org/)
(see `node-version` in
[build.yml](https://github.com/FACT-Finder/snage/blob/master/.github/workflows/build.yml))
and [Yarn 1](https://classic.yarnpkg.com/).

```bash
$ git clone https://github.com/FACT-Finder/snage.git
$ cd snage
$ yarn install --frozen-lockfile
$ yarn lerna run build
```

The build creates `packages/snage/build/npm/snage.js`, which includes the web
UI. Run it with Node.js:

```bash
$ node packages/snage/build/npm/snage.js help
snage <command>
...
```

!!! tip
    The build doesn't delete old files. Run
    `rm -rf packages/snage/build packages/ui/build` before it
    to get a clean build.
