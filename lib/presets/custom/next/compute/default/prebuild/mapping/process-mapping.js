import { resolve } from 'path';
import { rmSync, statSync } from 'fs';

import { feedback } from '#utils';
import { addLeadingSlash, stripIndexRoute } from '../../../utils/routing.js';

/**
 * Given a source route it normalizes its src value if needed.
 *
 * (In this context normalization means tweaking the src value so that it follows
 * a format which Vercel expects).
 * Note: this function applies the change side-effectfully to the route object.
 * @param {object} route Route which src we want to potentially normalize
 */
function normalizeRouteSrc(route) {
  if (!route.src) return;

  // we rely on locale root routes pointing to '/' to perform runtime checks
  // so we cannot normalize such src values as that would break things later on
  // see: https://github.com/cloudflare/next-on-pages/blob/654545/packages/next-on-pages/templates/_worker.js/routes-matcher.ts#L353-L358
  if (route.locale && route.src === '/') return;

  // Route src should always start with a '^'
  // see: https://github.com/vercel/vercel/blob/ea5bc88/packages/routing-utils/src/index.ts#L77
  if (!route.src.startsWith('^')) {
    // eslint-disable-next-line no-param-reassign
    route.src = `^${route.src}`;
  }

  // Route src should always end with a '$'
  // see: https://github.com/vercel/vercel/blob/ea5bc88/packages/routing-utils/src/index.ts#L82
  if (!route.src.endsWith('$')) {
    // eslint-disable-next-line no-param-reassign
    route.src = `${route.src}$`;
  }
}

/**
 * Check if a route is a Vercel handler.
 * @param {object} route - The route to check.
 * @returns {boolean} - Whether the route is a Vercel handler.
 */
export function isVercelHandler(route) {
  return 'handle' in route;
}

/**
 * Process the Vercel config.
 * @param {object} config - The Vercel config.
 * @returns {object} - The processed config.
 */
function processVercelConfig(config) {
  const processedConfig = {
    ...config,
    routes: {
      none: [],
      filesystem: [],
      miss: [],
      rewrite: [],
      resource: [],
      hit: [],
      error: [],
    },
  };

  let currentPhase = 'none';
  config.routes?.forEach((route) => {
    if (isVercelHandler(route)) {
      currentPhase = route.handle;
    } else {
      normalizeRouteSrc(route);
      processedConfig.routes[currentPhase].push(route);
    }
  });
  return processedConfig;
}

/**
 * Collect all middleware paths from the Vercel build output config.
 * @param {Array} routes - Processed routes from the Vercel build output config.
 * @returns {Set} - Set of middleware paths.
 */
function collectMiddlewarePaths(routes) {
  return new Set(
    routes.map((route) => route.middlewarePath ?? '').filter(Boolean),
  );
}

/**
 * Rewrite middleware paths in the functions map to match the build output config.
 *
 * In the build output config, the `middlewarePath` value is used to denote where the entry point
 * for a middleware function is located. This path does not have a leading slash.
 *
 * For matching requests in the routing system, we use the path name from the request and check
 * against the map of functions. The path name from the request will have a leading slash.
 *
 * It might be possible to accidentally call a middleware function if the request path name matches
 * the middleware path name in the functions map, so to avoid accidental calls, and to match the
 * value in the build output config, we remove the leading slash from the key in the map for each
 * middleware path.
 * @param {Map} processedOutput - Map of path names to function entries.
 * @param {Set} middlewarePaths - Set of middleware paths.
 */
function rewriteMiddlewarePaths(processedOutput, middlewarePaths) {
  // eslint-disable-next-line no-restricted-syntax
  for (const middlewarePath of middlewarePaths) {
    const withLeadingSlash = addLeadingSlash(middlewarePath);
    const entry = processedOutput.get(withLeadingSlash);

    if (entry?.type === 'function') {
      processedOutput.set(middlewarePath, { ...entry, type: 'middleware' });
      processedOutput.delete(withLeadingSlash);
    } else {
      feedback.prebuild.info(
        `Middleware path '${middlewarePath}' does not have a function.`,
      );
    }
  }
}

/**
 * Apply the overrides from the Vercel build output config to the processed output map.
 *
 * The overrides are used to override the output of a static asset. This includes the path name it
 * will be served from, and the content type.
 * @example
 * ```
 * // Serve the static file `500.html` from the path `/500` with the content type `text/html`.
 * { '500.html': { path: '500', contentType: 'text/html' } }
 * ```
 * link https://vercel.com/docs/build-output-api/v3/configuration#overrides
 * @param {object} vercelConfig - Processed Vercel build output config.
 * @param {object} vercelConfig.overrides - Overrides from the Vercel build output config.
 * @param {Map} vercelOutput - Map of path names to function entries.
 */
function applyVercelOverrides({ overrides }, vercelOutput) {
  Object.entries(overrides ?? []).forEach(
    ([rawAssetPath, { path: rawServedPath, contentType }]) => {
      const assetPath = addLeadingSlash(rawAssetPath);
      const servedPath = addLeadingSlash(rawServedPath ?? '');

      const newValue = {
        type: 'override',
        path: assetPath,
        headers: contentType ? { 'content-type': contentType } : undefined,
      };

      // Update the existing static record to contain the new `contentType` and `assetPath`.
      const existingStaticRecord = vercelOutput.get(assetPath);
      if (existingStaticRecord?.type === 'static') {
        vercelOutput.set(assetPath, newValue);
      }

      // Add the new served path to the map, overriding the existing record if it exists.
      if (servedPath) {
        vercelOutput.set(servedPath, newValue);
      }

      // If the served path is an index route, add a squashed version of the path to the map.
      const strippedServedPath = stripIndexRoute(servedPath);
      if (strippedServedPath !== servedPath) {
        vercelOutput.set(strippedServedPath, newValue);
      }
    },
  );
}

/**
 * Apply the prerendered routes and their overrides to the processed output map.
 * @param {Map} prerenderedRoutes - Prerendered routes to apply to the output map.
 * @param {Map} vercelOutput - Map of path names to build output items.
 */
function applyPrerenderedRoutes(prerenderedRoutes, vercelOutput) {
  prerenderedRoutes.forEach(({ headers, overrides }, path) => {
    if (path !== '/favicon.ico') {
      vercelOutput.set(path, {
        type: 'override',
        path,
        headers,
      });
    }

    overrides?.forEach((overridenPath) => {
      vercelOutput.set(overridenPath, {
        type: 'override',
        path,
        headers,
      });
    });
  });
}

/**
 * Take the static assets and functions that are read from the file system and turn them into a map
 * that can be consumed by the routing system.
 * @param {object} config - Vercel build output config.
 * @param {Array} staticAssets - List of static asset paths from the file system.
 * @param {Map} prerenderedRoutes - Map of prerendered files from the file system.
 * @param {Map} functionsMap - Map of functions from the file system.
 * @returns {object} - Processed Vercel build output map.
 */
export function processVercelOutput(
  config,
  staticAssets,
  prerenderedRoutes = new Map(),
  functionsMap = new Map(),
) {
  const processedConfig = processVercelConfig(config);

  const processedOutput = new Map(
    staticAssets.map((path) => [path, { type: 'static' }]),
  );
  functionsMap.forEach((value, key) => {
    // node custom server
    if (value.match(/azion-node-server\.js/)) {
      processedOutput.set(key, {
        type: 'node',
        // node calls global node custom server run function. Check runOrFetchBuildOutputItem function.
        entrypoint: null,
      });
    } else {
      processedOutput.set(key, {
        type: 'function',
        // NOTE: We replace the `.rsc.func.js` extension with `.func.js` as RSC functions have the
        // same exact content (and hash) as their non-rsc counterpart, so we opt to use the latter instead.
        // This also resolves an unclear runtime error that happens during routing when rsc functions are bundled:
        // `TypeError: Cannot read properties of undefined (reading 'default')`
        entrypoint: value.replace(/\.rsc\.func\.js$/i, '.func.js'),
      });
    }

    // Remove the RSC functions from the dist directory as they are not needed since we replace them with non-rsc variants for the runtime routing
    if (/\.rsc\.func\.js$/i.test(value)) {
      rmSync(value);
    }
  });
  // Apply the overrides from the build output config to the processed output map.
  applyVercelOverrides(processedConfig, processedOutput);

  // Apply the prerendered routes and their overrides to the processed output map.
  applyPrerenderedRoutes(prerenderedRoutes, processedOutput);

  rewriteMiddlewarePaths(
    processedOutput,
    collectMiddlewarePaths(processedConfig.routes.none),
  );
  return {
    vercelConfig: processedConfig,
    vercelOutput: processedOutput,
  };
}

/**
 * Detect builded functions.
 */
export function detectBuildedFunctions() {
  console.log('Detecting builded functions ...');
  try {
    const functionsDir = resolve('.vercel/output/functions');
    statSync(functionsDir);
  } catch (error) {
    throw new Error(error.message);
  }
}
