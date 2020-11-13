---
issue: 104
type: change
audience: user
components:
  - config
version: 0.1.0
date: 2020-06-12
---

# Rename/reorder `.snage.yaml` properties

Use
```bash
$ snage migrate
```
to migrate your config.

Example changes:
```diff
-version: 1
+version: 2
-links:
-  - name: "GitHub#${issue}"
-    link: "https://github.com/FACT-Finder/snage/issues/${issue}"
+note:
+  links:
+    - name: "GitHub#${issue}"
+      link: "https://github.com/FACT-Finder/snage/issues/${issue}"
-note:
-  basedir: changelog
-  file: "${issue}-${type}.md"
-fileTemplateText: |
-  # Summary line
-
-  - Write in active language
-  - ...
+basedir: changelog
+template:
+  file: ${issue}-${type}.md
+  text: |
+    # Summary line
+
+    - Write in active language
+    - ...
 fields:
   - name: issue
     type: number
```
