"use strict";
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.serveStatic = void 0;
const require_1 = require("./require");
/**
 * Serves the contents of a file at a path.
 * (A reimplementation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/serve-static.ts)
 */
async function serveStatic(assets, req, res, path, dir) {
    const decodedPath = decodeURIComponent(path);
    // const asset = readAssetFile(assets, decodedPath, dir);
    const asset = await (0, require_1.readAsyncAssetFile)(assets, decodedPath, dir);
    const outgoingHeaders = new Headers();
    // Copy all the headers that have already been set on this response
    // for example those set by setImmutableAssetCacheControl()
    const nodeRes = res.originalResponse;
    for (const [key, value] of Object.entries(nodeRes.getHeaders())) {
        if (value == null) {
            continue;
        }
        if (Array.isArray(value)) {
            for (const entry of value) {
                outgoingHeaders.append(key, entry);
            }
        }
        else {
            outgoingHeaders.append(key, String(value));
        }
    }
    if (!outgoingHeaders.has('Content-Type')) {
        outgoingHeaders.append('Content-Type', (0, require_1.getAssetContentType)(assets, decodedPath, dir));
    }
    res.overrideResponse = new Response(asset, {
        status: 200,
        statusText: 'OK',
        headers: outgoingHeaders,
    });
}
exports.serveStatic = serveStatic;
//# sourceMappingURL=serve-static.js.map