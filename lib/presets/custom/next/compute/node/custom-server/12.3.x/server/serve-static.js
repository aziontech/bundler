/*
 * Copyright Azion
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Fastly, Inc, licensed under the MIT license. See LICENSE file for details.
 */

import { getAssetContentType, readAsyncAssetFile } from './require.js';

/**
 * Serves the contents of a file at a path.
 * (A reimplementation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/serve-static.ts)
 * @param {object} assets object with assets infos
 * @param {object} req the request object
 * @param {object} res the response object
 * @param {string} path the asset path
 * @param {string} dir the reference dir
 */
export default async function serveStatic(assets, req, res, path, dir) {
  const decodedPath = decodeURIComponent(path);

  const asset = await readAsyncAssetFile(assets, decodedPath, dir);

  const outgoingHeaders = new Headers();

  // Copy all the headers that have already been set on this response
  // for example those set by setImmutableAssetCacheControl()
  const nodeRes = res.originalResponse;
  const headersEntries = Object.entries(nodeRes.getHeaders());
  for (let i = 0; i < headersEntries.length; i++) {
    const [key, value] = headersEntries[i];
    if (value == null) {
      // eslint-disable-next-line no-continue
      continue;
    }
    if (Array.isArray(value)) {
      for (let j = 0; j < value.length; j++) {
        outgoingHeaders.append(key, value[j]);
      }
    } else {
      outgoingHeaders.append(key, String(value));
    }
  }

  if (!outgoingHeaders.has('Content-Type')) {
    outgoingHeaders.append(
      'Content-Type',
      getAssetContentType(assets, decodedPath, dir),
    );
  }

  res.overrideResponse = new Response(asset, {
    status: 200,
    statusText: 'OK',
    headers: outgoingHeaders,
  });
}
