"use strict";
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputeJsNextResponse = exports.ComputeJsNextRequest = void 0;
const node_1 = require("next/dist/server/base-http/node");
class ComputeJsNextRequest extends node_1.NodeNextRequest {
    constructor(req, client) {
        super(req);
        this.client = client;
    }
}
exports.ComputeJsNextRequest = ComputeJsNextRequest;
class ComputeJsNextResponse extends node_1.NodeNextResponse {
}
exports.ComputeJsNextResponse = ComputeJsNextResponse;
//# sourceMappingURL=compute-js.js.map