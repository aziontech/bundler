---
'@aziontech/bundler': patch
---

`azbundler build --preset <name>` now stops right away when the `azion.config` declares a different `build.preset` (for example `--preset astro` in a project configured for `vue`), the same way `--config-version` does when it conflicts with the `version` of the `azion.config`. Before, the flag silently won and the build failed later, far from the cause. Remove the flag or update `build.preset` to continue.
