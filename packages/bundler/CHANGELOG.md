# @aziontech/bundler

## 1.2.0

### Minor Changes

- [#655](https://github.com/aziontech/bundler/pull/655) [`61cd890`](https://github.com/aziontech/bundler/commit/61cd8900a5332eb7ccbac9953ef3a1e20353bf92) Thanks [@jose-filho-azion](https://github.com/jose-filho-azion)! - Add `--config-file <path>` to the build, dev, manifest, config and presets commands, to choose which `azion.config` is used (for example `azbundler build --config-file azion.staging.config.ts`). Without the flag, `azion.config.*` is searched in the current directory as before. A missing file is an error, and the dev watcher rebuilds when the given file changes. The dev rebuilds triggered by the watcher now keep `--skip-framework-build` and `--function-name`, which they used to lose.

- [#652](https://github.com/aziontech/bundler/pull/652) [`3b12348`](https://github.com/aziontech/bundler/commit/3b1234853f0b25fe7e03f0d64376e6996cbf921b) Thanks [@jose-filho-azion](https://github.com/jose-filho-azion)! - Support the Azion config (API) versions 3 and 4. The version comes from `--config-version` (build, dev, manifest and presets commands) or from the `version` field of `azion.config`, and defaults to 4, so existing projects are not affected. The preset config, the manifest and the generated `azion.config` follow the resolved version, and the generated file now declares `version` explicitly. Declaring different versions in the flag and in `azion.config` is an error.

- [#656](https://github.com/aziontech/bundler/pull/656) [`6859648`](https://github.com/aziontech/bundler/commit/68596487079e9dfdb4490c91386a26ff8cfd3b0c) Thanks [@jose-filho-azion](https://github.com/jose-filho-azion)! - The `ctx` of the `firewall` handler in `export default { firewall: (request, env, ctx) => {...} }` now exposes the firewall event actions (`deny`, `drop`, `continue`, `respondWith`, `addRequestHeader` and `addResponseHeader`), so `ctx.deny()` behaves like `event.deny()` in `addEventListener('firewall', (event) => {...})`.

### Patch Changes

- [#652](https://github.com/aziontech/bundler/pull/652) [`3b12348`](https://github.com/aziontech/bundler/commit/3b1234853f0b25fe7e03f0d64376e6996cbf921b) Thanks [@jose-filho-azion](https://github.com/jose-filho-azion)! - Update `chokidar` to 4 (the file watcher of `dev`), which no longer depends on `braces`, an affected package with no patched release.

- [#652](https://github.com/aziontech/bundler/pull/652) [`3b12348`](https://github.com/aziontech/bundler/commit/3b1234853f0b25fe7e03f0d64376e6996cbf921b) Thanks [@jose-filho-azion](https://github.com/jose-filho-azion)! - `dev` no longer watches `node_modules` (nor the folders the bundler writes). With `chokidar` 4 every watched file keeps a watcher, so the `node_modules` of a real project made the watcher fail with `EMFILE: too many open files`.

## 1.1.4

### Patch Changes

- [#641](https://github.com/aziontech/bundler/pull/641) [`6fb86be`](https://github.com/aziontech/bundler/commit/6fb86befb8e93051b0e27e36af2153b4357cd903) Thanks [@jose-filho-azion](https://github.com/jose-filho-azion)! - fix: merge .env files with proper precedence and add temporary env var name aliasing

## 1.1.3

### Patch Changes

- [#631](https://github.com/aziontech/bundler/pull/631) [`01fb687`](https://github.com/aziontech/bundler/commit/01fb68799b12fcd9ecf6893c0621d8c021604c5c) Thanks [@jcbsfilho](https://github.com/jcbsfilho)! - chore: update preview @aziontech/\* pcks to fix security vulnerabilities

## 1.1.2

### Patch Changes

- [#627](https://github.com/aziontech/bundler/pull/627) [`4e9ba9f`](https://github.com/aziontech/bundler/commit/4e9ba9fc3bf3732edd196a82e9c37b40578ba5e3) Thanks [@jcbsfilho](https://github.com/jcbsfilho)! - fix: verify functions[].path matches the generated build entry output

## 1.1.1

### Patch Changes

- [#624](https://github.com/aziontech/bundler/pull/624) [`97e9cc9`](https://github.com/aziontech/bundler/commit/97e9cc9333cdd5c416fa74ea6b722e2e795fd1a6) Thanks [@jcbsfilho](https://github.com/jcbsfilho)! - upgrade lib @aziontech/config to reorganize schemas and normalize firewall behavior shape

## 1.1.0

### Minor Changes

- [#622](https://github.com/aziontech/bundler/pull/622) [`d571fcd`](https://github.com/aziontech/bundler/commit/d571fcdea4dbeeddbe40782ea36ed0683d3ec42b) Thanks [@jcbsfilho](https://github.com/jcbsfilho)! - feat: add runtime fixes required to support the Nitro preset.
  - Handle cross-realm `Object` comparison in seroval: `switch (a) { case Object: }` uses strict `===` which fails across V8 realms. EdgeVM creates its own realm, so objects from the outer Node.js context carry a different `Object` constructor identity. The fix normalizes the reference before the switch statement by detecting cross-realm `Object` constructors.
  - Expose `AsyncLocalStorage` directly on the runtime context so frameworks like Nitro can access it without additional polyfills.

## 1.0.0

### Major Changes

- [#608](https://github.com/aziontech/bundler/pull/608) [`efee7fd`](https://github.com/aziontech/bundler/commit/efee7fd07a31f14048802be6134c7204bcc9578c) Thanks [@jcbsfilho](https://github.com/jcbsfilho)! - feat: migrate from azion to @aziontech scoped packages
