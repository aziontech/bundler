---
'@aziontech/bundler': minor
---

Add support for the Azion config version 6. `--config-version 6` (or `version: 6` in the `azion.config`) makes the build, dev, manifest and presets commands read and generate the v6 config and manifest, which adds environments, deployments and workload bindings. The supported versions are now 3, 4 and 6, and the `--config-version` help lists all of them.
