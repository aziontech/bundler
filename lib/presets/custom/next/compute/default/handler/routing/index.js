// this code is based on cf build next tool (https://github.com/cloudflare/next-on-pages)

import { RoutesMatcher } from './routes-matcher.js';
import { runOrFetchBuildOutputItem } from './utils.js';
import { applyHeaders } from './http.js';
import { findMatch } from './matcher.js';

/**
 * Serves a file from the Vercel build output.
 * @param {object} reqCtx Request Context object.
 * @param {object} match The match from the Vercel build output.
 * @param {string} match.path The path to the file to serve.
 * @param {number} match.status The status code to return.
 * @param {object} match.headers The headers to return.
 * @param {object} match.searchParams The search params to return.
 * @param {object} match.body The body to return.
 * @param {object} output The Vercel build output.
 * @returns {Response} A response object.
 */
async function generateResponse(
  reqCtx,
  { path = '/404', status, headers, searchParams, body },
  output,
) {
  // Redirect user to external URL for redirects.
  const locationHeader = headers.normal.get('location');
  if (locationHeader) {
    // Apply the search params to the location header if it was not from middleware.
    // Middleware that returns a redirect will specify the destination, including any search params
    // that they want to include. Therefore, we should not be appending search params to those.
    if (locationHeader !== headers.middlewareLocation) {
      const paramsStr = [...searchParams.keys()].length
        ? `?${searchParams.toString()}`
        : '';
      headers.normal.set('location', `${locationHeader ?? '/'}${paramsStr}`);
    }

    return new Response(null, { status, headers: headers.normal });
  }

  let resp =
    body !== undefined
      ? // If we have a response body from matching, use it instead.
        new Response(body, { status })
      : await runOrFetchBuildOutputItem(output[path], reqCtx, {
          path,
          status,
          headers,
          searchParams,
        });

  const newHeaders = headers.normal;
  applyHeaders(newHeaders, resp.headers);
  applyHeaders(newHeaders, headers.important);

  resp = new Response(resp.body, {
    ...resp,
    status: status || resp.status,
    headers: newHeaders,
  });

  return resp;
}

/**
 * Handles a request by processing and matching it against all the routing phases.
 * @param {object} reqCtx Request Context object (contains all we need in to know regarding the request in order to handle it).
 * @param {object} config The processed Vercel build output config.
 * @param {object} output Vercel build output.
 * @param {Array} buildMetadata Information about the build to be used in the routing.
 * @returns {Response} An instance of the router.
 */
async function handleRequest(reqCtx, config, output, buildMetadata) {
  const matcher = new RoutesMatcher(
    config.routes,
    output,
    reqCtx,
    buildMetadata,
  );
  const match = await findMatch(matcher);

  return generateResponse(reqCtx, match, output);
}

export { handleRequest, generateResponse };
