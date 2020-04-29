# fact-finder/snage 
[![codecov][codecov-badge]][codecov]
[![build][build-badge]][build]

## Download dependencies

```bash
$ yarn
```

## Run tests

```bash
$ CI=true yarn lerna run test
```

## Create Release

* [Draft a new release on GitHub](https://github.com/FACT-Finder/snage/releases/new)
* Wait for the build to finish successfully
* AUR
  * Clone repository `git clone ssh://aur@aur.archlinux.org/snage.git`
  * Update `PKGBUILD` with new version and set `pkgrel` to 1 if version changes
  * Run `updpkgsums`
  * Test build
    * Remove old package `sudo pacman -R snage`
    * Build package `makepkg`
    * Install package `sudo pacman -U snage-xxx-pkg.tar-xz`
  * Run `makepkg --printsrcinfo > .SRCINFO`
  * Commit and push

[build]: https://github.com/FACT-Finder/snage/actions?query=workflow%3A.github%2Fworkflows%2Fbuild.yml
[build-badge]: https://github.com/FACT-Finder/snage/workflows/.github/workflows/build.yml/badge.svg?branch=master
[codecov]: https://codecov.io/gh/fact-finder/snage/
[codecov-badge]: https://codecov.io/gh/fact-finder/snage/branch/master/graph/badge.svg
