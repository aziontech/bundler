"use strict";
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComputeJsNextRequest = exports.ComputeJsNextResponse = exports.NextServer = exports.generateETag = void 0;
/// <reference types='@fastly/js-compute' />
// import './core';
const compute_js_1 = require("./server/base-http/compute-js");
Object.defineProperty(exports, "ComputeJsNextRequest", { enumerable: true, get: function () { return compute_js_1.ComputeJsNextRequest; } });
Object.defineProperty(exports, "ComputeJsNextResponse", { enumerable: true, get: function () { return compute_js_1.ComputeJsNextResponse; } });
const next_1 = __importStar(require("./server/next"));
Object.defineProperty(exports, "NextServer", { enumerable: true, get: function () { return next_1.NextServer; } });
const etag_1 = __importDefault(require("./util/etag"));
exports.generateETag = etag_1.default;
exports.default = next_1.default;
//# sourceMappingURL=index.js.map