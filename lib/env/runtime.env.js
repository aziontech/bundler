import { NodeVM } from 'vm2';
import { join } from 'path';
import { readFileSync } from 'fs';
import { RuntimeApis, Messages } from '#constants';
import { feedback, debug } from '#utils';
import mime from 'mime-types';

/**
 * Modified fetch function that adds an additional path to the URL if it starts with 'file://'.
 * This function is used to simulate the local edge environment. When a 'file://' request is made,
 * it behaves as if the request is made from within the edge itself. In this case, an additional
 * '.edge/storage' folder is appended to the URL to represent the edge environment.
 * @param {URL} url - The URL to fetch.
 * @param {object} [options] - The fetch options.
 * @returns {Promise<Response>} A Promise that resolves to the Response object.
 */
function runtimeFetch(url, options) {
  if (url.href.startsWith('file://')) {
    const segments = url.pathname.split('/').filter(Boolean);
    const filePath = join(process.cwd(), '.edge', 'storage', segments.slice(1).join('/'));
    const fileContent = readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    // Crie um novo objeto Headers e adicione os cabeçalhos desejados
    const headers = new Headers();
    headers.append('Content-Type', contentType);

    const response = new Response(fileContent, { headers, ...options });
    return Promise.resolve(response);
  }
  return fetch(url, options);
}

/**
 * Executes the specified JavaScript code within a sandbox environment,
 * simulating the behavior of edges that use isolates.
 * @async
 * @param {string} code - The JavaScript code to be executed.
 * @param {object} event - The event object containing the request and other properties.
 * @returns {Promise<Response>} A Promise that resolves with the Response object.
 * @throws {Error} Will throw an error if the execution fails.
 * @description This runtime module is a JavaScript executor created in Node.js,
 * simulating the behavior of edges isolates to work locally.
 * It provides a sandbox environment similar to the Azion edges (running Deno),
 *  supporting Web APIs/WinterCG.
 * @example
 * try {
 *    const code = 'console.log("Hello, world!");';
 *    const event = { request: ... };
 *    const response = await runtime(code, event);
 *    console.log(response);
 * } catch (error) {
 *    console.error(error);
 * }
 */
async function runtime(code, event) {
  let fetchEventHandler = null;
  let respondWithPromise = null;

  const vm = new NodeVM({
    console: 'inherit',
    sandbox: {
      ...event,
      Headers,
      URL,
      fetch: runtimeFetch,
      Response,
      addEventListener: (type, handler) => {
        if (type !== 'fetch') {
          throw new Error(Messages.env.runtime.errors.fetch_event_type(type));
        }
        fetchEventHandler = handler;
      },
      removeEventListener: (type, handler) => {
        if (type !== 'fetch' || fetchEventHandler !== handler) {
          throw new Error(Messages.env.runtime.errors.fetch_event_remove_listener);
        }
        fetchEventHandler = null;
      },
    },
    require: {
      external: true,
      builtin: RuntimeApis,
    },
  });

  try {
    vm.run(code);
  } catch (error) {
    debug.error(error);
    feedback.runtime.error(Messages.env.runtime.errors.unknown_error);
    throw error;
  }

  if (!fetchEventHandler) {
    throw new Error(Messages.env.runtime.errors.fetch_event_missing);
  }

  let response;
  try {
    const fetchEvent = {
      request: event.request,
      respondWith: (responsePromise) => {
        respondWithPromise = responsePromise;
      },
      console: { log: (log) => feedback.server.log(log) },
    };
    fetchEventHandler(fetchEvent);
    response = respondWithPromise;
  } catch (error) {
    debug.error(error);
    feedback.runtime.error(Messages.env.runtime.errors.fetch_event_unknown_error);
    throw error;
  }

  if (!response) {
    throw new Error(Messages.env.runtime.errors.undefined_response);
  }

  return response;
}

export default runtime;
