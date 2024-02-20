/*
 * Copyright Azion
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Vercel, Inc. and Copyright Fastly, Inc, licensed under the MIT license. See LICENSE file for details.
 */

import { Buffer } from 'buffer';
import { join, relative } from 'path';

// imports user project dependencies (node_modules)
/* eslint-disable */
import {
  APP_PATHS_MANIFEST,
  FONT_MANIFEST,
  PAGES_MANIFEST,
  SERVER_DIRECTORY,
  SERVERLESS_DIRECTORY,
} from 'next/constants';
import { normalizeLocalePath } from 'next/dist/shared/lib/i18n/normalize-locale-path';
import { denormalizePagePath } from 'next/dist/shared/lib/page-path/denormalize-page-path';
import { normalizePagePath } from 'next/dist/shared/lib/page-path/normalize-page-path';
import {
  MissingStaticPage,
  PageNotFoundError,
} from 'next/dist/shared/lib/utils';
/* eslint-enable */

/**
 * Check if asset dir exists
 * @param {object} assets object with assets infos
 * @param {string} path the asset path
 * @param {string} dir the reference dir
 * @returns {boolean} existence indicative
 */
export function assetDirectoryExists(assets, path, dir) {
  const relativePath = relative(dir, path);
  return Object.keys(assets).some((key) => key.startsWith(`/${relativePath}/`));
}

/**
 * Filter assets based on a path
 * @param {object} assets object with assets infos
 * @param {string} path the asset path
 * @param {string} dir the reference dir
 * @returns {string[]} the filtered results
 */
export function assetDirectory(assets, path, dir) {
  const relativePath = relative(dir, path);
  return Object.keys(assets).filter((key) =>
    key.startsWith(`/${relativePath}/`),
  );
}

/**
 * Check if asset file exists
 * @param {object} assets object with assets infos
 * @param  {string} path the asset path
 * @param {string} dir the reference dir
 * @returns {boolean} indication of asset existence
 */
export function assetFileExists(assets, path, dir) {
  const relativePath = relative(dir, path);
  return `/${relativePath}` in assets;
}

/**
 * Read asset file (injected content) based on a path
 * @param {object} assets object with assets infos
 * @param {string} path the asset path
 * @param {string} dir the reference dir
 * @returns {Buffer} the asset content
 */
export function readAssetFile(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets[`/${relativePath}`];
  const buff = Buffer.from(file.content, 'base64');
  return buff;
}

/**
 * Read asset file from storage using fetch
 * @param {object} assets object with assets infos
 * @param {string} path the asset path
 * @param {string} dir the reference dir
 * @returns {Promise<Uint8Array>} the promise with the content
 */
export async function readAsyncAssetFile(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets[`/${relativePath}`];
  const urlOBJ = new URL(`${file.content}`, 'file://');
  const response = await fetch(`${urlOBJ}`);
  if (!response.ok) {
    console.log(
      `Error reading asset '${path}' in storage. Error: ${response.status} - ${response.statusText}`,
    );
    throw new Error('Error loading file.');
  }
  const buffer = await response.arrayBuffer();
  return Promise.resolve(new Uint8Array(buffer));
}

/**
 * Read asset file (injected content) as a string
 * @param {object} assets object with assets infos
 * @param {string} path the asset path
 * @param {string} dir the reference dir
 * @returns {string} the file content
 */
export function readAssetFileAsString(assets, path, dir) {
  let content = readAssetFile(assets, path, dir);
  if (typeof content !== 'string') {
    content = content.toString('utf8');
  }
  return content;
}

/**
 * Get asset content type
 * @param {object} assets object with assets infos
 * @param {string} path the asset path
 * @param {string} dir the reference dir
 * @returns {string} the file content type
 */
export function getAssetContentType(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets[`/${relativePath}`];
  return file.contentType;
}

/**
 * Read manifest files
 * @param {object} assets object with assets infos
 * @param {string} path the asset path
 * @param {string} dir the reference dir
 * @returns {object} the manifest in JSON format
 */
export function readAssetManifest(assets, path, dir) {
  const content = readAssetFileAsString(assets, path, dir);
  return JSON.parse(content);
}

/**
 * Get the asset module
 * @param {object} assets object with assets infos
 * @param {string} path the asset path
 * @param {string} dir the reference dir
 * @returns {any} asset module
 */
export function readAssetModule(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets[`/${relativePath}`];
  if (file.module instanceof Promise) {
    return Promise.resolve(file.module?.default || file.module);
  }
  return file.module;
}

/**
 * Finds the path that corresponds to a page, based on the pages manifest and localizations.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/require.ts)
 * @param {object} assets object with assets infos
 * @param {string} srcPage the page to be analysed
 * @param {string} dir reference dir
 * @param {string} distDir reference builded dir
 * @param {boolean} serverless indicates serverless mode
 * @param {boolean} dev indicates dev mode
 * @param {string[]} locales locales from nextjs config
 * @param {boolean} appDirEnabled indicates if app dir (experimental) is used or not
 * @returns {string} the page path
 */
export function getPagePath(
  assets,
  srcPage,
  dir,
  distDir,
  serverless,
  dev,
  locales,
  appDirEnabled,
) {
  let page = srcPage;
  const serverBuildPath = join(
    distDir,
    serverless && !dev ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY,
  );
  let rootPathsManifest;

  if (appDirEnabled) {
    rootPathsManifest = readAssetManifest(
      assets,
      join(serverBuildPath, APP_PATHS_MANIFEST),
      dir,
    );
  }
  const pagesManifest = readAssetManifest(
    assets,
    join(serverBuildPath, PAGES_MANIFEST),
    dir,
  );

  try {
    page = denormalizePagePath(normalizePagePath(page));
  } catch (err) {
    console.error(err);
    throw new PageNotFoundError(page);
  }

  const checkManifest = (manifest) => {
    let curPath = manifest[page];

    if (!manifest[curPath] && locales) {
      const manifestNoLocales = {};

      const manifestKeys = Object.keys(manifest);
      for (let i = 0; i < manifestKeys.length; i++) {
        const key = manifestKeys[i];
        manifestNoLocales[normalizeLocalePath(key, locales).pathname] =
          pagesManifest[key];
      }
      curPath = manifestNoLocales[page];
    }
    return curPath;
  };
  let pagePath;

  if (rootPathsManifest) {
    pagePath = checkManifest(rootPathsManifest);
  }

  if (!pagePath) {
    pagePath = checkManifest(pagesManifest);
  }

  if (!pagePath) {
    throw new PageNotFoundError(page);
  }
  return join(serverBuildPath, pagePath);
}

/**
 * Loads the string or module that corresponds to a page.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/require.ts)
 * @param {object} assets object with assets infos
 * @param {string} page the page to be analysed
 * @param {string} dir reference dir
 * @param {string} distDir reference builded dir
 * @param {boolean} serverless indicates serverless mode
 * @param {boolean} appDirEnabled indicates if app dir (experimental) is used or not
 * @returns {Promise<any>} a promise with the page, page asset module or missing page
 */
export async function requirePage(
  assets,
  page,
  dir,
  distDir,
  serverless,
  appDirEnabled,
) {
  const pagePath = getPagePath(
    assets,
    page,
    dir,
    distDir,
    serverless,
    false,
    undefined,
    appDirEnabled,
  );
  if (pagePath.endsWith('.html')) {
    try {
      return readAssetFileAsString(assets, pagePath, dir);
    } catch (err) {
      throw new MissingStaticPage(page, err.message);
    }
  }
  return readAssetModule(assets, pagePath, dir);
}

/**
 * Load the font manifest.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/require.ts)
 * @param {object} assets object with assets infos
 * @param {string} distDir reference builded dir
 * @param {string} dir reference dir
 * @param {boolean} serverless indicates serverless mode
 * @returns {object} the manifest in JSON format
 */
export function requireFontManifest(assets, distDir, dir, serverless) {
  const serverBuildPath = join(
    distDir,
    serverless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY,
  );
  return readAssetManifest(assets, join(serverBuildPath, FONT_MANIFEST), dir);
}
