# Simple js Firewall Event

This is an example of a firewall event, it shows how to add headers and how to respond with status code and metadata.

### Usage:

Run the build command:

```bash

vulcan build --firewall

```


Run the dev command:

```bash

vulcan dev --firewall

```

If everything goes as expected, the application runs successfully.

```bash

simple-js-firewall-event vulcan dev --firewall
[Vulcan] › ℹ  info      Using main.js as entrypoint...
[Vulcan] [Build] › ℹ  info      Loading build context ...
[Vulcan] [Build] › ℹ  info      Build without postbuild actions.
[Vulcan] [Pre Build] › ℹ  info      Starting prebuild...
[Vulcan] [Pre Build] › ✔  success   Prebuild succeeded!
[Vulcan] [Build] › ℹ  info      Starting Vulcan build...
[Vulcan] [Build] › ✔  success   Vulcan Build succeeded!
[Vulcan] [Server] › ✔  success   Function running on port 0.0.0.0:3000, url: http://localhost:3000

```

Open a new terminal and run the command below:

```bash

curl -I --location --request GET 'http://localhost:3000'

```

The output will be:

```bash

➜  curl -I --location --request GET 'http://localhost:3000'
HTTP/1.1 417 Expectation Failed
content-type: application/json; charset=utf-8
x-azion-outcome: respondWith
x-broccoli-cooking-method: Barbecue
x-country-name: United States
x-fire-status: On
x-fire-type: Coal
Date: Mon, 26 Feb 2024 14:24:01 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

```
