# Simple js Network List with Firewall

In this example we have a basic implementation of using the Network list with Firewall.

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

➜  simple-js-network-list-with-firewall vulcan dev --firewall
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

curl -svk http://localhost:3000 -H "x-network-list-id: 1111"

```

The answer will be:

```bash

*   Trying [::1]:3000...
* connect to ::1 port 3000 failed: Connection refused
*   Trying 127.0.0.1:3000...
* Connected to localhost (127.0.0.1) port 3000
> GET / HTTP/1.1
> Host: localhost:3000
> User-Agent: curl/8.4.0
> Accept: */*
> x-network-list-id: 1111
> 
< HTTP/1.1 200 OK
< content-type: text/plain;charset=UTF-8
< x-azion-outcome: continue
< Date: Fri, 01 Mar 2024 18:36:41 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
< Transfer-Encoding: chunked
< 
* Connection #0 to host localhost left intact
(mocked) continue to origin%

```
