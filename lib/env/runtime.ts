/**
 * @deprecated Legacy module that needs refactoring.
 * This module provides edge runtime simulation and should be restructured
 * to better handle different event types and contexts.
 */

import {
  fetchContext,
  FetchEventContext,
  AsyncHooksContext,
  StorageContext,
  EnvVarsContext,
  NetworkListContext,
  fsContext,
  FirewallEventContext,
  streamContext,
  cryptoContext,
  promisesContext,
} from 'azion/bundler/polyfills';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { EdgeContext, EdgeVM } from './edge-vm';
import { DIRECTORIES } from '#constants';
import { parseEnvFileEntries, unwrapEnvValue } from './dotenv';

/**
 * Loads the env vars the build already merged into .edge/.env (see copyEnvVars in utils.ts),
 * so the dev sandbox sees the same values a deployed function would (respecting .env.local,
 * .env.development, etc. precedence) instead of just the CLI process's own environment.
 * Falls back to process.env if .edge/.env doesn't exist yet (e.g. no .env files in the project).
 *
 * Values are unwrapped from surrounding quotes here (not in the shared parser), since this is
 * the only place a value becomes a literal string handed to a live JS context — .edge/.env and
 * .edge/.env.azion stay byte-faithful to what the user wrote.
 */
function loadSandboxEnv(): Record<string, string | undefined> {
  const edgeEnvPath = join(process.cwd(), DIRECTORIES.OUTPUT_ENV_VARS_PATH);
  if (!existsSync(edgeEnvPath)) return { ...process.env };

  const content = readFileSync(edgeEnvPath, 'utf-8');
  return Object.fromEntries(
    parseEnvFileEntries(content).map(({ key, value }) => [key, unwrapEnvValue(value)]),
  );
}

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
    context.fetch = async (resource, options) => fetchContext(context, resource, options);

    // Set the context for the FetchEvent if it's a Firewall event or a Fetch event
    context.FetchEvent = isFirewallEvent ? FirewallEventContext : FetchEventContext;
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
    context.process = { env: loadSandboxEnv() };

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

    // Stream
    context.STREAM_CONTEXT = streamContext;

    // Crypto
    context.CRYPTO_CONTEXT = cryptoContext;

    // Promises
    context.Promise = Promise;
    context.Promise.withResolvers = promisesContext;

    return context;
  };

  const edgeRuntime = new EdgeVM({
    extend,
    initialCode: code,
    codeGeneration: {
      strings: true,
    },
  });
  return edgeRuntime;
}

export default runtime;
