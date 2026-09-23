---
type: remove
issue: 281
audience: developer
---
# Remove unused webpack-dev-server dependency

`webpack-dev-server` was declared as a dependency of snage but never used. Removing it also removes its open vulnerability alerts, including those that the update to v5.2.4 in #285 did not resolve.
