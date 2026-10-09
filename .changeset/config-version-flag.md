---
'@aziontech/bundler': minor
---

Support the Azion config (API) versions 3 and 4. The version comes from `--config-version` (build, dev, manifest and presets commands) or from the `version` field of `azion.config`, and defaults to 4, so existing projects are not affected. The preset config, the manifest and the generated `azion.config` follow the resolved version, and the generated file now declares `version` explicitly. Declaring different versions in the flag and in `azion.config` is an error.
