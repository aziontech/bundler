import { join } from 'path';
import { readFileSync } from 'fs';
import mime from 'mime-types';
import { EdgeRuntime } from 'edge-runtime';
import { getUrlFromResource } from '#utils';

/**
 * A custom fetch implementation that adds an additional path to the URL if it starts with 'file://'.
 * This function is used to simulate the local edge environment. When a 'file://' request is made,
 * it behaves as if the request is made from within the edge itself. In this case, an additional
 * '.edge/storage' folder is appended to the URL to represent the edge environment.
 * @param {EdgeRuntime} context - VMContext
 * @param {URL|Request|string} resource - The resource to fetch.
 * @param {object} [options] - The fetch options.
 * @returns {Promise<Response>} A Promise that resolves to the Response object.
 */
async function fetchContext(context, resource, options) {
  const { Headers, Response, RESERVED_FETCH } = context;

  const urlObj = getUrlFromResource(context, resource);

  if (urlObj.href.startsWith('file://')) {
    const file = urlObj.pathname;
    const filePath = join(process.cwd(), '.edge', 'storage', file);

    const fileContent = readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    const headers = new Headers();
    headers.append('Content-Type', contentType);

    const response = new Response(fileContent, { headers, ...options });
    return response;
  }

  return RESERVED_FETCH(resource, options);
}

export default fetchContext;
