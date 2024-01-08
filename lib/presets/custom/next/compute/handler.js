/* eslint-disable import/no-unresolved */
// .edge files are dynamically generated
import { assets } from './.edge/next-build/statics.js';

import {
  adjustRequestForVercel,
  handleRequest,
} from './default/routing/index.js';

const createServer =
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

const getStorageAsset = async (request) => {
  // eslint-disable-next-line no-undef
  const VERSION_ID = AZION_VERSION_ID;
  try {
    const requestPath = new URL(request.url).pathname;
    const assetUrl = new URL(
      requestPath === '/'
        ? `${VERSION_ID}/index.html`
        : VERSION_ID + requestPath,
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
  globalThis.process.env = { ...globalThis.process.env, ...env };

  const adjustedRequest = adjustRequestForVercel(request);

  return handleRequest(
    {
      request: adjustedRequest,
      ctx,
      assetsFetcher: env.ASSETS,
    },
    // eslint-disable-next-line no-undef
    __CONFIG__,
    // eslint-disable-next-line no-undef
    __BUILD_OUTPUT__,
  );
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
