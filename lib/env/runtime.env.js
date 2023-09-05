import { EdgeRuntime } from 'edge-runtime';

import { fetchPolyfill, FetchEventPolyfill } from './polyfills/index.js';

/**
 * Executes the specified JavaScript code within a sandbox environment,
 * simulating the behavior of edges that use isolates.
 * @param {string} code - The JavaScript code to be executed.
 * @returns {EdgeRuntime} An instance of the 'EdgeRuntime' class that represents
 *                        the sandboxed environment where the code will be executed.
 *
 * This function allows you to run JavaScript code within a sandboxed environment,
 * similar to how it would behave on edges that use isolates. It uses the 'EdgeRuntime'
 * class provided by the 'edge-runtime' library to create the sandboxed environment.
 *
 * Example usage:
 * ```
 * const code = `
 *   addEventListener('fetch', event => {
 *     const { searchParams } = new URL(event.request.url)
 *     const url = searchParams.get('url')
 *     return event.respondWith(fetch(url))
 *   })`;
 *
 * const isolate = new runtime(code);
 *
 *   const response = await isolate.dispatchFetch('http://localhost:3000');
 *
 *   // If your code logic performs asynchronous tasks, you should await them.
 *   // https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil
 *   await response.waitUntil();
 *
 *   // `response` is a Web standard, you can use any of its methods
 *   console.log(response.status);
 * ```
 */
function runtime(code) {
  const extend = (context) => {
    context.fetch = (resource, options) => fetchPolyfill(context, resource, options);
    context.FetchEvent = FetchEventPolyfill;
    context.FirewallEvent = {}; // TODO: Firewall Event
    /*
     * According to the Vercel documentation at https://vercel.com/docs/concepts/functions/edge-functions/edge-runtime#unsupported-apis,
     * the default runtime doesn't support `eval`.
     * However, in our Runtime environment (Cells Runtime/Azion)
     * we've enabled and support its functionality.
     */
    // eslint-disable-next-line no-eval
    context.eval = eval;

    /* ==== Cells Runtime/Azion does not have this interface ==== */
    context.File = undefined;
    context.WebSocket = undefined;
    /* ========================================================== */

    return context;
  };

  const edgeRuntime = new EdgeRuntime({
    extend,
    initialCode: code,
    codeGeneration: {
      strings: true,
    },
  });
  return edgeRuntime;
}

export default runtime;
