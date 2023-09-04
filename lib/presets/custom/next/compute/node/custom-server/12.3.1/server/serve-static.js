/* eslint-disable no-restricted-syntax */
import { getAssetContentType, readAsyncAssetFile } from './require.js';

/**
 * Serves the contents of a file at a path.
 * (A reimplementation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/serve-static.ts)
 * @param assets
 * @param _req
 * @param res
 * @param path
 * @param dir
 */
export default async function serveStatic(assets, _req, res, path, dir) {
  const decodedPath = decodeURIComponent(path);
  // const asset = readAssetFile(assets, decodedPath, dir);

  const asset = await readAsyncAssetFile(assets, decodedPath, dir);

  const outgoingHeaders = new Headers();

  // Copy all the headers that have already been set on this response
  // for example those set by setImmutableAssetCacheControl()
  const nodeRes = res.originalResponse;
  for (const [key, value] of Object.entries(nodeRes.getHeaders())) {
    if (value == null) {
      // eslint-disable-next-line no-continue
      continue;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        outgoingHeaders.append(key, entry);
      }
    } else {
      outgoingHeaders.append(key, String(value));
    }
  }

  if (!outgoingHeaders.has('Content-Type')) {
    outgoingHeaders.append(
      'Content-Type',
      getAssetContentType(assets, decodedPath, dir)
    );
  }

  res.overrideResponse = new Response(asset, {
    status: 200,
    statusText: 'OK',
    headers: outgoingHeaders,
  });
}
