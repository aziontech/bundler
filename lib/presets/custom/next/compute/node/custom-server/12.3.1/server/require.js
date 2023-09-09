/*
 * Copyright Azion
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Vercel, Inc. and Copyright Fastly, Inc, licensed under the MIT license. See LICENSE file for details.
 */

import { Buffer } from 'buffer';
import { join, relative } from 'path';

import { APP_PATHS_MANIFEST, FONT_MANIFEST, PAGES_MANIFEST, SERVER_DIRECTORY, SERVERLESS_DIRECTORY } from 'next/constants';
import { normalizeLocalePath } from 'next/dist/shared/lib/i18n/normalize-locale-path';
import { denormalizePagePath } from 'next/dist/shared/lib/page-path/denormalize-page-path';
import { normalizePagePath } from 'next/dist/shared/lib/page-path/normalize-page-path';
import { MissingStaticPage, PageNotFoundError } from 'next/dist/shared/lib/utils';

/**
 * Finds the path that corresponds to a page, based on the pages manifest and localizations.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/require.ts)
 */
export function getPagePath(assets, page, dir, distDir, serverless, dev, locales, appDirEnabled) {
  const serverBuildPath = join(distDir, serverless && !dev ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY);
  let rootPathsManifest;

  if (appDirEnabled) {
    rootPathsManifest = readAssetManifest(assets, join(serverBuildPath, APP_PATHS_MANIFEST), dir);
  }
  const pagesManifest = readAssetManifest(assets, join(serverBuildPath, PAGES_MANIFEST), dir);

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

      for (const key of Object.keys(manifest)) {
        manifestNoLocales[normalizeLocalePath(key, locales).pathname] = pagesManifest[key];
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
 */
export async function requirePage(assets, page, dir, distDir, serverless, appDirEnabled) {
  const pagePath = getPagePath(assets, page, dir, distDir, serverless, false, undefined, appDirEnabled);
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
 */
export function requireFontManifest(assets, distDir, dir, serverless) {
  const serverBuildPath = join(distDir, serverless ? SERVERLESS_DIRECTORY : SERVER_DIRECTORY);
  return readAssetManifest(assets, join(serverBuildPath, FONT_MANIFEST), dir);
}

/* ---- */

export function assetDirectoryExists(assets, path, dir) {
  const relativePath = relative(dir, path);
  return Object.keys(assets).some((key) => key.startsWith('/' + relativePath + '/'));
}

export function assetDirectory(assets, path, dir) {
  const relativePath = relative(dir, path);
  return Object.keys(assets).filter((key) => key.startsWith('/' + relativePath + '/'));
}

export function assetFileExists(assets, path, dir) {
  const relativePath = relative(dir, path);
  return '/' + relativePath in assets;
}

export function readAssetFile(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets['/' + relativePath];
  let buff = new Buffer(file.content, 'base64');
  return buff;
}

export async function readAsyncAssetFile(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets['/' + relativePath];
  const urlOBJ = new URL(`${file.content}`, 'file://');
  const response = await fetch(`${urlOBJ}`);
  if (!response.ok) {
    throw new Error('Error loading file.');
  }
  const buffer = await response.arrayBuffer();
  return Promise.resolve(new Uint8Array(buffer));
}

export function readAssetFileAsString(assets, path, dir) {
  let content = readAssetFile(assets, path, dir);
  if (typeof content !== 'string') {
    content = content.toString('utf8');
  }
  return content;
}

export function getAssetContentType(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets['/' + relativePath];
  return file.contentType;
}

export function readAssetManifest(assets, path, dir) {
  let content = readAssetFileAsString(assets, path, dir);
  return JSON.parse(content);
}

export function readAssetModule(assets, path, dir) {
  const relativePath = relative(dir, path);
  const file = assets['/' + relativePath];
  return file.module;
}
