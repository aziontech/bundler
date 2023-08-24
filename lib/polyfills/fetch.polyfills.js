import { join } from 'path';
import { readFileSync } from 'fs';
import mime from 'mime-types';
import { EdgeRuntime } from 'edge-runtime';

/**
 * A custom fetch implementation that adds an additional path to the URL if it starts with 'file://'.
 * This function is used to simulate the local edge environment. When a 'file://' request is made,
 * it behaves as if the request is made from within the edge itself. In this case, an additional
 * '.edge/storage' folder is appended to the URL to represent the edge environment.
 * @param {EdgeRuntime} context - VMContext
 * @param {URL} url - The URL to fetch.
 * @param {object} [options] - The fetch options.
 * @returns {Promise<Response>} A Promise that resolves to the Response object.
 */
async function fetchPolyfill(context, url, options) {
  const {
    URL, Headers, Response,
  } = context;

  const urlOBJ = new URL(url);
  if (urlOBJ.href.startsWith('file://')) {
    // url pathname = /VERSION_ID/filePath
    const file = url.pathname.slice(15);
    const filePath = join(process.cwd(), '.edge', 'storage', file);
    const fileContent = readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    const headers = new Headers();
    headers.append('Content-Type', contentType);

    const response = new Response(fileContent, { headers, ...options });
    return response;
  }

  return fetch(url, options);
}

export default fetchPolyfill;
