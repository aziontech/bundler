/* eslint-disable import/no-unresolved */
// .edge files are dynamically generated
import { assets } from './.edge/next-build/statics.js';

const createServer = require('./.edge/next-build/custom-server/index.js').default;

globalThis.runNodeCustomServer = async function runNodeCustomServer(request) {
  const server = await createServer({
    dir: '.',
    computeJs: {
      assets,
      backends: {
        httpbin: { url: 'https://httpbin.org/anything/' },
      },
    },
  });
  const event = {
    request,
    client: undefined,
  };
  const result = await server.handleFetchEvent(event);

  return result;
};
