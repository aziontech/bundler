# Simple js Network List

In this example we have a basic implementation of using the Network list.

### Usage:

Run the build command:

```bash

vulcan build

```

Run the dev command:

```bash

vulcan dev

```

If everything goes as expected, the application runs successfully.

```bash

➜  simple-js-network-list vulcan dev
[Vulcan] › ℹ  info      Using main.js as entrypoint...
[Vulcan] [Build] › ℹ  info      Loading build context ...
[Vulcan] [Build] › ℹ  info      Build without postbuild actions.
[Vulcan] [Pre Build] › ℹ  info      Starting prebuild...
[Vulcan] [Pre Build] › ✔  success   Prebuild succeeded!
[Vulcan] [Build] › ℹ  info      Starting Vulcan build...
[Vulcan] [Build] › ✔  success   Vulcan Build succeeded!
[Vulcan] [Server] › ✔  success   Function running on port 0.0.0.0:3000, url: http://localhost:3000

```

Open in new terminal and execute the command:

```bash

curl -svk http://localhost:3000 -H "x-network-list-id: 1111" -H "x-element: 10.0.0.1"

```

The answer will be:

```bash

curl -svk http://localhost:3000 -H "x-network-list-id: 1111" -H "x-element: 10.0.0.1"
*   Trying [::1]:3000...
* connect to ::1 port 3000 failed: Connection refused
*   Trying 127.0.0.1:3000...
* Connected to localhost (127.0.0.1) port 3000
> GET / HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/8.4.0
> Accept: */*
> x-network-list-id: 1111
> x-element: 10.0.0.1
>
< HTTP/1.1 200 OK
< content-type: text/plain;charset=UTF-8
< x-element: 10.0.0.1
< x-presence: present # value present
< Date: Mon, 04 Mar 2024 12:37:56 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< Transfer-Encoding: chunked
<
* Connection #0 to host localhost left intact

```
