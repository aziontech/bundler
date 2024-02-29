# Simple js esm Storage

This is an example of storage use, it shows how to add and get data.

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
➜  simple-js-esm-storage vulcan dev
[Vulcan] › ℹ  info      Using ./main.js as entrypoint...
[Vulcan] [Build] › ℹ  info      Loading build context ...
[Vulcan] [Build] › ℹ  info      Build without postbuild actions.
[Vulcan] [Pre Build] › ℹ  info      Starting prebuild...
[Vulcan] [Pre Build] › ✔  success   Prebuild succeeded!
[Vulcan] [Build] › ℹ  info      Starting Vulcan build...
[Vulcan] [Build] › ✔  success   Vulcan Build succeeded!
[Vulcan] [Server] › ✔  success   Function running on port 0.0.0.0:3000, url: http://localhost:3000
```

To add data open a new terminal and run the command below:

```bash
curl --location --request POST 'http://localhost:3000/hello/hello.txt' \
--data '@hello.txt'
```

The output will be:

```bash
curl --location --request POST 'http://localhost:3000/hello/hello.txt' \
--data '@hello.txt'
ok%
```

To get data open a new terminal and run the command below:

```bash
curl --location --request GET 'http://localhost:3000/hello/hello.txt'
```

The output will be:

```bash
curl --location --request GET 'http://localhost:3000/hello/hello.txt'
Foo Bar%
```
