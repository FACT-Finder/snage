If you want to use docker, you can use our [snage/snage](https://hub.docker.com/r/snage/snage) image.
Replace `$VERSION` with the latest version. Currently: <span class="latest_release_version">loading</span>

<div id="term-docker" data-termynal data-ty-typeDelay="40" data-ty-lineDelay="700">
    <span data-ty="input" data-ty-prompt="$">docker run --rm snage/snage:$VERSION help</span>
    <span data-ty>snage &lt;command&gt; ...</span>
</div>

To work with your notes, mount your project into the container and run snage
as your own user. Otherwise git refuses to read the repository
("dubious ownership") and the [providers](../config.md#providers) fail.

```bash
$ docker run --rm -u "$(id -u):$(id -g)" -v "$PWD:/repo" -w /repo snage/snage:$VERSION lint
$ docker run --rm -u "$(id -u):$(id -g)" -v "$PWD:/repo" -w /repo -p 8080:8080 snage/snage:$VERSION serve
```
