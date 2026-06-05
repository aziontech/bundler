---
'@aziontech/bundler': minor
---

feat: add runtime fixes required to support the Nitro preset.

- Handle cross-realm `Object` comparison in seroval: `switch (a) { case Object: }` uses strict `===` which fails across V8 realms. EdgeVM creates its own realm, so objects from the outer Node.js context carry a different `Object` constructor identity. The fix normalizes the reference before the switch statement by detecting cross-realm `Object` constructors.
- Expose `AsyncLocalStorage` directly on the runtime context so frameworks like Nitro can access it without additional polyfills.
