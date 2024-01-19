import {
  applyHeaders,
  createRouteRequest,
  createMutableResponse,
  applySearchParams,
} from './http.js';

/**
 * Gets the next phase of the routing process.
 *
 * Determines which phase should follow the `none`, `filesystem`, `rewrite`, or `resource` phases.
 * Falls back to `miss`.
 * @param phase Current phase of the routing process.
 * @returns Next phase of the routing process.
 */
function getNextPhase(phase) {
  switch (phase) {
    // `none` applied headers/redirects/middleware/`beforeFiles` rewrites. It checked non-dynamic routes and static assets.
    case 'none': {
      return 'filesystem';
    }
    // `filesystem` applied `afterFiles` rewrites. It checked those rewritten routes.
    case 'filesystem': {
      return 'rewrite';
    }
    // `rewrite` applied dynamic params to requests. It checked dynamic routes.
    case 'rewrite': {
      return 'resource';
    }
    // `resource` applied `fallback` rewrites. It checked the final routes.
    case 'resource': {
      return 'miss';
    }
    default: {
      return 'miss';
    }
  }
}

/**
 * Runs or fetches a build output item.
 * @param item Build output item to run or fetch.
 * @param request.request
 * @param request Request object.
 * @param match Matched route details.
 * @param assets Fetcher for static assets.
 * @param ctx Execution context for the request.
 * @param request.assetsFetcher
 * @param request.ctx
 * @param match.path
 * @param match.searchParams
 * @returns Response object.
 */
async function runOrFetchBuildOutputItem(
  item,
  { request, assetsFetcher, ctx },
  { path, searchParams },
) {
  let resp;

  // Apply the search params from matching the route to the request URL.
  const url = new URL(request.url);
  applySearchParams(url.searchParams, searchParams);
  const req = new Request(url, request);
  try {
    switch (item?.type) {
      case 'function':
      case 'middleware': {
        // TODO: check other examples (rsc, app router, ...)
        const edgeFunction = item.entrypoint;
        resp = await edgeFunction.default(req, ctx);
        break;
      }
      case 'override': {
        // TODO: check override actions
        resp = createMutableResponse(
          await assetsFetcher.fetch(createRouteRequest(req, item.path ?? path)),
        );

        if (item.headers) {
          applyHeaders(resp.headers, item.headers);
        }
        break;
      }
      case 'static': {
        // TODO - Use azion format to get assets
        resp = await assetsFetcher.fetch(createRouteRequest(req, path));
        break;
      }
      // run custom node server
      case 'node': {
        resp = await globalThis.runNodeCustomServer(req);
        break;
      }
      default: {
        resp = new Response('Not Found', { status: 404 });
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return new Response('Internal Server Error', { status: 500 });
  }

  return createMutableResponse(resp);
}

/**
 * Checks if a source route's matcher uses the regex format for locales with a trailing slash, where
 * the locales specified are known.
 *
 * Determines whether a matcher is in the format of `^//?(?:en|fr|nl)/(.*)`.
 * @param src Source route `src` regex value.
 * @param locales Known available locales.
 * @returns Whether the source route matches the regex for a locale with a trailing slash.
 */
function isLocaleTrailingSlashRegex(src, locales) {
  const prefix = '^//?(?:';
  const suffix = ')/(.*)';

  if (!src.startsWith(prefix) || !src.endsWith(suffix)) {
    return false;
  }

  const foundLocales = src.slice(prefix.length, -suffix.length).split('|');
  return foundLocales.every((locale) => locale in locales);
}

export { getNextPhase, runOrFetchBuildOutputItem, isLocaleTrailingSlashRegex };