import { Buffer } from 'buffer';

/**
 * Buffer use examples
 */
function buffeExamples() {
  const buffer1 = Buffer.alloc(10);
  const buffer2 = Buffer.from([1, 2, 3]);
  const buffer3 = Buffer.from('Hello, world!', 'utf-8');

  console.log(buffer1); // Output: <Buffer 00 00 00 00 00 00 00 00 00 00>
  console.log(buffer2); // Output: <Buffer 01 02 03>
  console.log(buffer3.toString()); // Output: "Hello, world!"

  buffer1.write('Hello', 'utf-8');
  console.log(buffer1.toString()); // Output: "Hello"

  buffer1[5] = 33;
  console.log(buffer1); // Output: <Buffer 48 65 6c 6c 6f 21>

  const combinedBuffer = Buffer.concat([buffer1, buffer2]);
  console.log(combinedBuffer.toString()); // Output: "Hello, world!♡"

  const slicedBuffer = buffer3.slice(0, 5);
  console.log(slicedBuffer.toString()); // Output: "Hello"

  console.log(buffer1.length); // Output: 10
  console.log(buffer1.equals(buffer2)); // Output: false

  const json = JSON.stringify(buffer3);
  // Output: {"type":"Buffer","data":[72,101,108,108,111,44,32,119,111,114,108,100,33]}
  console.log(json);

  const parsedJson = JSON.parse(json, (key, value) =>
    value && value.type === 'Buffer' ? Buffer.from(value.data) : value,
  );
  console.log(parsedJson.toString()); // Output: "Hello, world!"

  return {
    fullMessage: parsedJson.toString(),
    message: buffer1.toString(),
  }
}

// eslint-disable-next-line
export default (event) => {
  const respData = buffeExamples();

  return new Response(JSON.stringify(respData), {
    headers: new Headers([['Content-Type', 'application/json']]),
    status: 200,
  });
};
