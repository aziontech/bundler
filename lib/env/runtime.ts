/**
 * @deprecated Legacy module that needs refactoring.
 * This module provides edge runtime simulation and should be restructured
 * to better handle different event types and contexts.
 */
import { EdgeRuntime } from 'edge-runtime';
import { EdgeContext } from '@edge-runtime/vm';

import {
  fetchContext,
  FetchEventContext,
  AsyncHooksContext,
  StorageContext,
  EnvVarsContext,
  NetworkListContext,
  fsContext,
  FirewallEventContext,
} from 'azion/bundler/polyfills';

/**
 * Executes the specified JavaScript code within a sandbox environment,
 * simulating the behavior of edges that use isolates.
 * the sandboxed environment where the code will be executed.
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
function runtime(code: string, isFirewallEvent = false) {
  const extend = (context: EdgeContext) => {
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
    /* ==== Cells Runtime/Azion have this interface ==== */
    context.process = { env: process.env };

    /* ==== Cells Runtime/Azion does not have this interface ==== */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context.File = undefined as any;
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
