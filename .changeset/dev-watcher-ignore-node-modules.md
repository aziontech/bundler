---
'@aziontech/bundler': patch
---

`dev` no longer watches `node_modules` (nor the folders the bundler writes). With `chokidar` 4 every watched file keeps a watcher, so the `node_modules` of a real project made the watcher fail with `EMFILE: too many open files`.
