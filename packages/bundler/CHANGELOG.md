# @aziontech/bundler

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
