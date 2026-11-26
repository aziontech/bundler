---
'@aziontech/bundler': patch
---

chore: upgrade `@aziontech/builder` and `@aziontech/presets` to the releases that ship the runtime polyfills of `@aziontech/unenv-preset` (`Buffer.prototype.indexOf` with `Uint8Array`, `setImmediate` returning an `Immediate`, microtask-based `process.nextTick`, static `AsyncLocalStorage.snapshot()`/`bind()`, global `reportError`, and a `performance.timeOrigin` that follows `Date.now()`). The OpenNext Azion adapter no longer carries these polyfills, so projects built with it need this bundler version or newer (`azbundler --version`); Azion CLI versions that embed an older bundler return a 500 on on-demand pages.
