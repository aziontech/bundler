import { EdgeRuntime } from 'edge-runtime';

import { fetchPolyfill, FetchEventPolyfill } from '#polyfills';

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
    context.fetch = (url, options) => fetchPolyfill(context, url, options);
    context.FetchEvent = FetchEventPolyfill;
    context.FirewallEvent = {}; // TODO: Firewall Event

    /* ==== Cells Runtime/Azion does not have this interface ==== */
    context.File = undefined;
    context.WebSocket = undefined;
    /* ========================================================== */

    return context;
  };

  const edgeRuntime = new EdgeRuntime({ extend, initialCode: code });
  return edgeRuntime;
}

export default runtime;
