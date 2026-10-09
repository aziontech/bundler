---
'@aziontech/bundler': minor
---

Add `--config-file <path>` to the build, dev, manifest, config and presets commands, to choose which `azion.config` is used (for example `azbundler build --config-file azion.staging.config.ts`). Without the flag, `azion.config.*` is searched in the current directory as before. A missing file is an error, and the dev watcher rebuilds when the given file changes. The dev rebuilds triggered by the watcher now keep `--skip-framework-build` and `--function-name`, which they used to lose.
