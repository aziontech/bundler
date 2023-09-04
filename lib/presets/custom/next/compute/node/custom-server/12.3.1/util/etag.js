"use strict";
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Vercel, Inc., licensed under the MIT license. See LICENSE file for details.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Generates an etag string based on a payload.
 * (An adaptation for Compute@Edge of function in Next.js of the same name,
 * found at next/server/api-utils/web.ts)
 */
function generateETag(payload) {
    if (payload.length === 0) {
        // fast-path empty
        return '"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"';
    }
    // compute hash of entity
    // Do this without using crypto.subtle, as the crypto
    // polyfill doesn't support it.
    const hash = crypto_1.default
        .createHash('sha1')
        .update(payload, 'utf8')
        .digest('base64')
        .substring(0, 27);
    // compute length of entity
    const len = buffer_1.Buffer.byteLength(payload);
    return '"' + len.toString(16) + '-' + hash + '"';
}
exports.default = generateETag;
//# sourceMappingURL=etag.js.map