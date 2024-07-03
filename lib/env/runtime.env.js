import { EdgeRuntime } from 'edge-runtime';

import {
  fetchContext,
  FetchEventContext,
  AsyncHooksContext,
  StorageContext,
  EnvVarsContext,
  NetworkListContext,
  fsContext,
} from './polyfills/index.js';
import FirewallEventContext from './polyfills/azion/firewall-event/index.js';

/**
 * Executes the specified JavaScript code within a sandbox environment,
 * simulating the behavior of edges that use isolates.
 * @param {string} code - The JavaScript code to be executed.
 * @param {boolean} isFirewallEvent - If the code is a Firewall event.
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
function runtime(code, isFirewallEvent = false) {
  const extend = (context) => {
    context.RESERVED_FETCH = context.fetch.bind(context);
    context.fetch = async (resource, options) =>
      fetchContext(context, resource, options);

    // Set the context for the FetchEvent if it's a Firewall event or a Fetch event
    context.FetchEvent = isFirewallEvent
      ? FirewallEventContext
      : FetchEventContext;
    context.Response = isFirewallEvent ? Response : context.Response;

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

    // Async Hooks
    context.ASYNC_LOCAL_STORAGE = AsyncHooksContext;

    // Storage Context
    context.STORAGE_CONTEXT = StorageContext;

    // EnvVars Context
    context.ENV_VARS_CONTEXT = EnvVarsContext;

    // Network List Context
    context.NETWORK_LIST_CONTEXT = NetworkListContext;

    // FS Context
    context.FS_CONTEXT = fsContext;

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
