---
'@aziontech/bundler': patch
---

Fix `SyntaxError: Identifier 'Event' has already been declared` in `azbundler dev` when the project declares a function with the name of a Web API global at the top level of its code, such as `function Event() {}`. The globals of the sandbox (`Event`, `Request`, `Headers`, `URL` and the others) are now configurable, so the project can declare or override them, as it can in the Azion runtime.
