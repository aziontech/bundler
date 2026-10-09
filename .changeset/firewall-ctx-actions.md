---
'@aziontech/bundler': minor
---

The `ctx` of the `firewall` handler in `export default { firewall: (request, env, ctx) => {...} }` now exposes the firewall event actions (`deny`, `drop`, `continue`, `respondWith`, `addRequestHeader` and `addResponseHeader`), so `ctx.deny()` behaves like `event.deny()` in `addEventListener('firewall', (event) => {...})`.
