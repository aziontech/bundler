---
'@aziontech/bundler': patch
---

feat: bind `azion/args.json` to `ctx.args` in `azbundler dev`. The `export default { fetch, firewall }` handlers now receive the same args the deployed runtime provides (`fetch(request, env, ctx)` → `ctx.args`, and `event.args` for `addEventListener`). The file is read on every request, so editing it needs no restart or rebuild. A missing file, or one that is not a JSON object, results in `{}`. The new `--args-path <path>` option of `dev` points to another args file (for example the one the Azion CLI is configured to use).
