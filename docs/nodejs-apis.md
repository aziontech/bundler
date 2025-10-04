### Node.js APIs

Azion Bundler provides a set of APIs to help you build and test your Node.js projects. The following sections detail the available APIs and how to use them.

#### Example usage

See more: [Buffer Example](https://github.com/aziontech/bundler-examples/tree/main/examples/runtime-apis/nodejs/buffer)

```javascript
import { Buffer } from "node:buffer";

const main = async (event) => {
  const helloBuffer = Buffer.from("Hello Edge!", "utf8");
  console.log(helloBuffer.toString("hex"));
  // 48656c6c6f204564676521
  console.log(helloBuffer.toString("base64"));
  // SGVsbG8gRWRnZSE=

  helloBuffer.write("World", 6, 5, "utf8");
  console.log(helloBuffer.toString());
  // Hello World!
  return new Response(helloBuffer.toString(), { status: 200 });
};

export default main;

```

#### Support report

Tests run daily in the [Bundler Examples](https://github.com/aziontech/bundler-examples/tree/main/examples/runtime-apis/nodejs).

Table:
| Test           | Status |
| -------------- | ------ |
| Process        | ✅      |
| Path           | ✅      |
| Os             | ✅      |
| String Decoder | ✅      |
| Timers         | ✅      |
| Stream         | ✅      |
| Module         | ✅      |
| Zlib           | ✅      |
| Util           | ✅      |
| Http           | ✅      |
| Url            | ✅      |
| Vm             | ✅      |
| Crypto         | ✅      |
| Events         | ✅      |
| Buffer         | ✅      |
| Fs             | ✅      |
| Async Hooks    | ✅      |

Last test run date: 10/04/25 03:42:51 AM
#### Docs support

See support for the Node.js APIs in the [https://www.azion.com/en/documentation/products/azion-edge-runtime/compatibility/node/](https://www.azion.com/en/documentation/products/azion-edge-runtime/compatibility/node/)

