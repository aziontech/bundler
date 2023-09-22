import { assets } from './.edge/next-build/statics.js';

const createServer =
  require('./.edge/next-build/custom-server/index.js').default;

/**
 * Handles the 'fetch' event.
 * @param {FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handle(event) {
  const server = await createServer({
    dir: '.',
    computeJs: {
      assets,
      backends: {
        httpbin: { url: 'https://httpbin.org/anything/' },
      },
    },
  });
  return await server.handleFetchEvent(event);
}
