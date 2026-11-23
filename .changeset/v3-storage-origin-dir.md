---
'@aziontech/bundler': patch
---

The v3 build now copies to `.edge/storage` the directory declared in the `dir` of the `object_storage` origin of the `azion.config`, instead of reading it from the v4 config of the preset. An `azion.config` that does not declare the `dir` (for example one generated before it existed) uses the `dir` of the v3 config of the preset. The build fails with the path when the directory does not exist.
