---
type: security
issue: 259
audience: user
components:
  - ui
---
# Update axios to v1.7.4

Vulnerability Alert CVE-2024-39338

axios 1.7.2 allows SSRF via unexpected behavior where requests for path relative URLs get processed as protocol relative URLs.
