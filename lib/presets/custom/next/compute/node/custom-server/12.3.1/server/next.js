"use strict";
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextServer = void 0;
const accepts_1 = __importDefault(require("accepts"));
const http_compute_js_1 = require("@fastly/http-compute-js");
const constants_1 = require("next/constants");
const compute_js_1 = require("./base-http/compute-js");
const config_1 = require("./config");
const next_compute_js_server_1 = __importDefault(require("./next-compute-js-server"));
class NextServer {
    constructor(options) {
        this.options = options;
        this.server = null;
    }
    async getServer() {
        var _a;
        if (this.server != null) {
            return this.server;
        }
        const conf = await (0, config_1.loadConfig)(constants_1.PHASE_PRODUCTION_SERVER, this.options.computeJs.assets, (_a = this.options.dir) !== null && _a !== void 0 ? _a : ".", this.options.conf);
        this.server = new next_compute_js_server_1.default({
            ...this.options,
            conf,
        });
        return this.server;
    }
    async getRequestHandler() {
        return (await this.getServer()).getRequestHandler();
    }
    getUpgradeHandler() {
        return async (req, socket, head) => {
            throw new Error("Upgrading not supported");
        };
    }
    async handleFetchEvent(event) {
        const { req, res } = (0, http_compute_js_1.toReqRes)(event.request);
        const nextRequest = new compute_js_1.ComputeJsNextRequest(req, event.client);
        const nextResponse = new compute_js_1.ComputeJsNextResponse(res);
        const requestHandler = await this.getRequestHandler();
        await requestHandler(nextRequest, nextResponse);
        let computeResponse;
        // If the handler has set a response directly, then use it
        if (nextResponse.overrideResponse != null) {
            computeResponse = nextResponse.overrideResponse;
        }
        else {
            computeResponse = await (0, http_compute_js_1.toComputeResponse)(res);
        }
        if (nextResponse.compress && computeResponse.body != null) {
            const accept = (0, accepts_1.default)(req);
            const encoding = accept.encodings(["gzip", "deflate"]);
            if (encoding) {
                // computeResponse.headers.set("Content-Encoding", encoding);
                const body = await computeResponse.arrayBuffer();
                computeResponse = new Response(body, {
                    status: computeResponse.status,
                    statusText: computeResponse.statusText,
                    headers: computeResponse.headers,
                });
            }
        }
        return computeResponse;
    }
}
exports.NextServer = NextServer;
async function createServer(options) {
    const server = new NextServer(options);
    await server.getServer(); // In C@E there is no sense in lazy loading this
    return server;
}
exports.default = createServer;
//# sourceMappingURL=next.js.map