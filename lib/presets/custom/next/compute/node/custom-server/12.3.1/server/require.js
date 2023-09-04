/* eslint-disable no-buffer-constructor */
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Vercel, Inc., licensed under the MIT license.
 * See LICENSE file for details.
 */

import { join, relative } from 'path';
import { Buffer } from 'buffer';

import {
  APP_PATHS_MANIFEST,
  FONT_MANIFEST,
  PAGES_MANIFEST,
  SERVER_DIRECTORY,
  SERVERLESS_DIRECTORY,
} from 'next/constants.js';
import { normalizeLocalePath } from 'next/dist/shared/lib/i18n/normalize-locale-path.js';
import { denormalizePagePath } from 'next/dist/shared/lib/page-path/denormalize-page-path.js';
import { normalizePagePath } from 'next/dist/shared/lib/page-path/normalize-page-path.js';
import {
  MissingStaticPage,
  PageNotFoundError,
} from 'next/dist/shared/lib/utils.js';

/**
 *
 * @param assets
 * @param path
 * @param dir
 */
export function readAssetModule(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets[`/${relativePath}`];
  return file.module;
}

/**
 *
 * @param assets
 * @param path
 * @param dir
 */
export function readAssetFile(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets[`/${relativePath}`];
  const buff = new Buffer(file.content, 'base64');
  return buff;
}

/**
 *
 * @param assets
 * @param path
 * @param dir
 */
export function readAssetFileAsString(assets, path, dir) {
  let content = readAssetFile(assets, path, dir);
  if (typeof content !== 'string') {
    content = content.toString('utf8');
  }
  return content;
}

/**
 *
 * @param assets
 * @param path
 * @param dir
 */
export function readAssetManifest(assets, path, dir) {
  const content = readAssetFileAsString(assets, path, dir);
  return JSON.parse(content);
}
/**
 * Finds the path that corresponds to a page, based on the pages manifest and localizations.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/require.ts)
 * @param assets
 * @param page
 * @param dir
 * @param distDir
 * @param serverless
 * @param dev
 * @param locales
 * @param appDirEnabled
 */

/**
 *
 * @param assets
 * @param page
 * @param dir
 * @param distDir
 * @param serverless
 * @param dev
 * @param locales
 * @param appDirEnabled
 */
export function getPagePath(
  assets,
  page,
  dir,
  distDir,
  serverless,
  dev,
  locales,
  appDirEnabled
) {
  const serverBuildPath = join(
    distDir,
    serverless && !dev ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY
  );
  let rootPathsManifest;

  if (appDirEnabled) {
    rootPathsManifest = readAssetManifest(
      assets,
      join(serverBuildPath, APP_PATHS_MANIFEST),
      dir
    );
  }
  const pagesManifest = readAssetManifest(
    assets,
    join(serverBuildPath, PAGES_MANIFEST),
    dir
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

      // eslint-disable-next-line no-restricted-syntax
      for (const key of Object.keys(manifest)) {
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
 * Load the font manifest.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/require.ts)
 * @param assets
 * @param distDir
 * @param dir
 * @param serverless
 */
export function requireFontManifest(assets, distDir, dir, serverless) {
  const serverBuildPath = join(
    distDir,
    serverless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY
  );
  return readAssetManifest(assets, join(serverBuildPath, FONT_MANIFEST), dir);
}

/**
 * Loads the string or module that corresponds to a page.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/require.ts)
 * @param assets
 * @param page
 * @param dir
 * @param distDir
 * @param serverless
 * @param appDirEnabled
 */
export async function requirePage(
  assets,
  page,
  dir,
  distDir,
  serverless,
  appDirEnabled
) {
  const pagePath = getPagePath(
    assets,
    page,
    dir,
    distDir,
    serverless,
    false,
    undefined,
    appDirEnabled
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
 *
 * @param assets
 * @param path
 * @param dir
 */
export function assetDirectoryExists(assets, path, dir) {
  const relativePath = relative(dir, path);
  return Object.keys(assets).some((key) => key.startsWith(`/${relativePath}/`));
}

/**
 *
 * @param assets
 * @param path
 * @param dir
 */
export function assetDirectory(assets, path, dir) {
  const relativePath = relative(dir, path);
  return Object.keys(assets).filter((key) =>
    key.startsWith(`/${relativePath}/`)
  );
}

/**
 *
 * @param assets
 * @param path
 * @param dir
 */
export function assetFileExists(assets, path, dir) {
  const relativePath = relative(dir, path);
  return `/${relativePath}` in assets;
}

/**
 *
 * @param assets
 * @param path
 * @param dir
 */
export async function readAsyncAssetFile(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets[`/${relativePath}`];
  const urlOBJ = new URL(`${file.content}`, 'file://');
  const response = await fetch(`${urlOBJ}`);
  if (!response.ok) {
    throw new Error('Error loading file.');
  }
  const buffer = await response.arrayBuffer();
  return Promise.resolve(new Uint8Array(buffer));
}

/**
 *
 * @param assets
 * @param path
 * @param dir
 */
export function getAssetContentType(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets[`/${relativePath}`];
  return file.contentType;
}
