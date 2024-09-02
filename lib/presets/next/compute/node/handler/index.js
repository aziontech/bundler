// .edge files are dynamically generated
// eslint-disable-next-line
import { assets } from './.edge/next-build/statics.js';
const createServer =
  // eslint-disable-next-line
  require('./.edge/next-build/custom-server/index.js').default;

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
