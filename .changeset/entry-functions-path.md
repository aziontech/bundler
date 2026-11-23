---
'@aziontech/bundler': patch
---

When `azbundler build --entry` runs in a project without an `azion.config`, the generated `azion.config` now points `functions[].path` to the file the build of that entry generates (for example `--entry index.js` writes `./functions/index.js`), instead of the default path of the preset. Before, the next build failed with a path mismatch. An existing `azion.config` is not changed.
