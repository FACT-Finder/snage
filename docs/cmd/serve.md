`snage serve` starts a web server with a searchable view of your changelog.

```bash
$ snage serve
Listening on 8080
$ snage serve --port 3000
Listening on 3000
```

Open [http://localhost:8080](http://localhost:8080) in your browser.
[changelog.snage.dev](https://changelog.snage.dev) shows what it looks like.

Snage reads all notes once at startup and doesn't start if a note is invalid.
Restart the server to pick up new or changed notes.

## Web UI

* **Search:** type a [query](../query.md),
  e.g. `audience = user and version > 0.5`.
* **Filter by value:** click a field value on a note to show only notes with
  that value.
* **Details:** click a note to open its full text.
* **Share:** the URL contains the query and the opened note,
  so you can bookmark it or send it to others.
* **Export:** download the matching notes as one markdown file,
  like [`snage export`](export.md).

## Options

| Option     | Default | Description                     |
| ---------- | ------- | ------------------------------- |
| `--port`   | `8080`  | The port snage listens on.      |

## Monitoring

Snage provides [Prometheus](https://prometheus.io/) metrics at `/metrics`.
