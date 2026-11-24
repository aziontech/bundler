---
'@aziontech/bundler': patch
---

`--skip-framework-build` now warns when the output of the framework build it is supposed to reuse is missing or empty (for example, no `dist` folder), instead of ending the build "successfully" with nothing to publish. The help of the flag also explains what it does: it does not run the framework build and reuses the output of a previous one, so that build must run first.
