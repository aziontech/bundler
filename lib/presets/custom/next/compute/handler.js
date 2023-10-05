/* eslint-disable import/no-unresolved */
// .edge files are dynamically generated
import { assets } from './.edge/next-build/statics.js';

const createServer =
  require('./.edge/next-build/custom-server/index.js').default;

/**
 * Handles the 'fetch' event.
 * @param {any} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handler(event) {
  const server = await createServer({
    dir: '.',
    computeJs: {
      assets,
      backends: {
        httpbin: { url: 'https://httpbin.org/anything/' },
      },
    },
  });
  const result = await server.handleFetchEvent(event);

  return result;
}

export default handler;
