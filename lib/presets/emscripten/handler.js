/* eslint-disable */
import createModule from './build/module';

let wasmPromise = null;

/**
 * Handles the 'fetch' event.
 * @param {import('azion/types').FetchEvent} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handler(event) {
  try {
    if (!wasmPromise) {
      wasmPromise = new Promise((resolve) => {
        createModule().then((module) => {
          resolve({
            fetch_listener: module.cwrap('fetch_listener', 'string', [
              'object',
            ]),
            module: module,
          });
        });
      });
    }
    let wasmModule = await wasmPromise;

    // Asyncfy transforms the call to fetch_listener into a promise. Therefore,
    // we need to await the result.
    const content = await wasmModule.fetch_listener(event);

    return new Response(content);
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
}

export default handler;
