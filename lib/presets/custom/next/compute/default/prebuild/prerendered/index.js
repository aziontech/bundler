import { join, relative, resolve } from 'path';
import { readdirSync } from 'fs';

import { feedback } from '#utils';
import {
  copyFileWithDir,
  normalizePath,
  readJsonFile,
  validateFile,
} from '../../../utils/fs.js';
import { formatRoutePath, stripIndexRoute } from '../../../utils/routing.js';

/**
 * Retrieves a valid prerendered route config. A valid config must have a type of 'prerender',
 * a fallback type of 'filefsref', and must specify a fallback fsPath. If any of these conditions
 * are not met, the config is considered invalid, and the function returns null.
 * @param {string} baseDir Base directory for the prerendered routes.
 * @param {string} file Prerendered config file name.
 * @param {string} dirName Directory name to use for the route.
 * @returns {Promise<object|null>} A valid prerendered route config, or null if the config is invalid.
 */
async function getRouteConfig(baseDir, file, dirName) {
  const configPath = join(baseDir, file);
  const config = await readJsonFile(configPath);

  if (
    config?.type?.toLowerCase() !== 'prerender' ||
    config?.fallback?.type?.toLowerCase() !== 'filefsref' ||
    !config?.fallback?.fsPath
  ) {
    const relativeName = normalizePath(join(dirName, file));
    feedback.prebuild.info(`Invalid prerender config for ${relativeName}`);
    return null;
  }

  return config;
}

/**
 * Retrieves the path to an existing prerendered route file, if available. It constructs the path
 * by combining the directory name and the filesystem path specified in the fallback configuration.
 * This is used to locate the prerendered file within the output directory, allowing the server
 * to serve this file for requests where the prerendered route is available.
 * @param {object} config - Configuration object containing the fallback configuration.
 * @param {object} config.fallback - The fallback configuration object specifying the handling
 * of requests when a prerendered file is not available. The `fallback` object within the `config` parameter includes the `fsPath` property, which is crucial as it
 * indicates the location of the fallback file within the output directory.
 * @param {string} dirName - Directory name to use for the route.
 * @param {string} outputDir - Vercel build output directory.
 * @returns {Promise<string|null>} - The path to the prerendered route file, or null if it does not exist.
 */
async function getRoutePath({ fallback }, dirName, outputDir) {
  const prerenderRoute = normalizePath(join(dirName, fallback.fsPath));
  const prerenderFile = join(outputDir, 'functions', prerenderRoute);

  // Check the prerendered file exists.
  if (!(await validateFile(prerenderFile))) {
    feedback.prebuild.info(
      `Could not find prerendered file for ${prerenderRoute}`,
    );
    return null;
  }

  return prerenderFile;
}

/**
 * Determines the new destination for the prerendered file, if no file already exists at that location.
 * It calculates the destination by modifying the fallback file's path to remove any prerender-fallback
 * markers, creating a path for the final prerendered file's location. This is used to ensure that
 * prerendered files are moved to their correct serving location within the static output directory,
 * unless a file already exists there, in which case it does nothing.
 * @example
 * ```ts
 * // index.prerender-fallback.html -> index.html
 * // index.rsc.prerender-fallback.rsc -> index.rsc
 * // favicon.ico.prerender-fallback.body -> favicon.ico
 * // data.json.prerender-fallback.json -> data.json
 * ```
 * @param {object} config - Configuration object containing the fallback configuration for the prerendered route.
 * @param {object} config.fallback - The fallback configuration object specifying how to handle requests
 * that cannot be served with a prerendered file. The `fallback` object within the `config` parameter includes the `fsPath` property, which is crucial as it
 * indicates the location of the fallback file within the output directory.
 * @param {string} dirName - Directory name to use for the route.
 * @param {string} outputDir - Vercel build output directory.
 * @returns {Promise<object|null>} - The new destination for the prerendered file, or null if a file already exists.
 */
async function getRouteDest({ fallback }, dirName, outputDir) {
  const destRoute = normalizePath(
    join(
      dirName,
      fallback.fsPath.replace(
        /\.prerender-fallback(?:\.(?:rsc|body|json))?/gi,
        '',
      ),
    ),
  );
  const destFile = join(outputDir, 'static', destRoute);

  // Check if a static file already exists at the new location.
  if (await validateFile(destFile)) {
    feedback.prebuild.info(`Prerendered file already exists for ${destRoute}`);
    return null;
  }

  return { destFile, destRoute };
}

/**
 * Validates a prerendered route and retrieve its config file, original file path, and new destination.
 * @param {string} baseDir Base directory for the prerendered routes.
 * @param {string} file Prerendered config file name.
 * @param {string} outputDir Vercel build output directory.
 * @returns {Promise<object|null>} Information for a valid prerendered route, or null if the route is invalid.
 */
async function validateRoute(baseDir, file, outputDir) {
  const dirName = relative(join(outputDir, 'functions'), baseDir);
  const config = await getRouteConfig(baseDir, file, dirName);
  if (!config) return null;

  const originalFile = await getRoutePath(config, dirName, outputDir);
  if (!originalFile) return null;

  const dest = await getRouteDest(config, dirName, outputDir);
  if (!dest) return null;

  return {
    config,
    originalFile,
    destFile: dest.destFile,
    destRoute: dest.destRoute,
  };
}

/**
 * Creates a list of overrides for a new route.
 * @param {string} newRoute New route to create overrides for.
 * @returns {Array<string>} List of overrides for the new route.
 */
function getRouteOverrides(newRoute) {
  // Create override entries that might normally be created through the build output config.
  const formattedPathName = normalizePath(formatRoutePath(newRoute));
  const withoutHtmlExt = formattedPathName.replace(/\.html$/, '');
  const strippedIndexRoute = stripIndexRoute(withoutHtmlExt);
  const overrides = new Set(
    [formattedPathName, withoutHtmlExt, strippedIndexRoute].filter(
      (route) => route !== `/${newRoute}`,
    ),
  );

  return [...overrides];
}

/**
 * Extracts the prerendered routes from a list of routes, copies the prerendered files to the
 * `.vercel/static/output` directory.
 *
 * Additionally, it creates paths to use for overrides for the routing process, along with the
 * correct headers to apply.
 * @param {Map<string, object>} prerenderedRoutes Map of prerendered files.
 * @param {Array<string>} files File paths to check for prerendered routes.
 * @param {string} baseDir Base directory for the routes.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
async function fixPrerenderedRoutes(prerenderedRoutes, files, baseDir) {
  const outputDir = resolve('.vercel', 'output');
  const configs = files.filter((file) =>
    /.+\.prerender-config\.json$/gi.test(file),
  );

  for (let index = 0; index < configs.length; index++) {
    const file = configs[index];

    // eslint-disable-next-line no-await-in-loop
    const routeInfo = await validateRoute(baseDir, file, outputDir);
    // eslint-disable-next-line no-continue
    if (!routeInfo) continue;

    const { config, originalFile, destFile, destRoute } = routeInfo;

    // eslint-disable-next-line no-await-in-loop
    await copyFileWithDir(originalFile, destFile);

    prerenderedRoutes.set(`/${destRoute}`, {
      headers: config.initialHeaders,
      overrides: getRouteOverrides(destRoute),
    });
  }
}

/**
 *
 * @param {Array<string>} vcConfigPaths - functions configs paths
 * @param {Map<string, object>} prerenderedRoutes - prerendered routes mapping
 */
// eslint-disable-next-line import/prefer-default-export
export default async function handlePrerenderedRoutes(
  vcConfigPaths,
  prerenderedRoutes,
) {
  // Action to get nested dirs, dirs that are not function dirs.
  // result example: ['', '/api', ...]
  const dirsToHandle = [
    ...new Set(
      vcConfigPaths.map((path) =>
        path.replace('/.vc-config.json', '').replace(/\/[^/]+\.func$/, ''),
      ),
    ),
  ];

  try {
    await Promise.all(
      dirsToHandle.map((dir) =>
        fixPrerenderedRoutes(prerenderedRoutes, readdirSync(dir), dir),
      ),
    );
  } catch (error) {
    const message = `Error handling prerendered routes: ${error}`;
    feedback.prebuild.error(message);
    throw Error(message);
  }
}
