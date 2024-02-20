/* eslint-disable */
import { handleRequest } from 'VULCAN_LIB_PATH/presets/custom/next/compute/default/handler/routing/index.js';
import { adjustRequestForVercel } from 'VULCAN_LIB_PATH/presets/custom/next/compute/default/handler/routing/http.js';

const getStorageAsset = async (request) => {
  try {
    const requestPath = new URL(request.url).pathname;
    const assetUrl = new URL(
      requestPath === '/' ? 'index.html' : requestPath,
      'file://',
    );

    return fetch(assetUrl);
  } catch (e) {
    return new Response(e.message || e.toString(), { status: 500 });
  }
};

/**
 *
 * @param request
 * @param env
 * @param ctx
 */
async function main(request, env, ctx) {
  const envAsyncLocalStorage = new AsyncLocalStorage();

  globalThis.process.env = { ...globalThis.process.env, ...env };

  return envAsyncLocalStorage.run({ ...env }, async () => {
    const adjustedRequest = adjustRequestForVercel(request);

    return handleRequest(
      {
        request: adjustedRequest,
        ctx,
        assetsFetcher: env.ASSETS,
      },
      __CONFIG__,
      __BUILD_OUTPUT__,
    );
  });
}

/**
 * Handles the 'fetch' event.
 * @param {any} event - The fetch event.
 * @returns {Promise<Response>} The response for the request.
 */
async function handler(event) {
  const env = {
    ASSETS: {
      fetch: getStorageAsset,
    },
  };

  const context = {
    waitUntil: event.waitUntil.bind(event),
    passThroughOnException: () => null,
  };

  const url = new URL(decodeURI(event.request.url));
  const request = new Request(url, event.request);

  return main(request, env, context);
}

export default handler;
