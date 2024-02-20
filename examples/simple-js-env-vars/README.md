# Simple js Env Vars

In this example we have a basic implementation of using the env vars API.

### Usage:

Run the build command:

```bash

vulcan build

```

Add the `MY_VAR` variable to the `.env` file.

```bash

MY_VAR="Edge Computing"

```

Run the dev command:

```bash

vulcan dev

```

If everything goes as expected, the application runs successfully.

```bash

➜  simple-js-env-vars vulcan dev
[Vulcan] › ℹ  info      Using main.js as entrypoint...
[Vulcan] [Build] › ℹ  info      Loading build context ...
[Vulcan] [Build] › ℹ  info      Build without postbuild actions.
[Vulcan] [Pre Build] › ℹ  info      Starting prebuild...
[Vulcan] [Pre Build] › ✔  success   Prebuild succeeded!
[Vulcan] [Build] › ℹ  info      Starting Vulcan build...
[Vulcan] [Build] › ✔  success   Vulcan Build succeeded!
[Vulcan] [Server] › ✔  success   Function running on port 0.0.0.0:3000, url: http://localhost:3000

```

Open in the browser or execute the command:

```bash

curl --location --request GET 'http://localhost:3000'

```

The answer will be:

```text

Hello Env Vars at Edge Computing!

```
