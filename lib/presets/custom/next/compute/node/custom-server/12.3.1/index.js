/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 */

import {
  ComputeJsNextRequest,
  ComputeJsNextResponse,
} from './server/base-http/compute-js.js';
import createServer, { NextServer } from './server/next.js';
import generateETag from './util/etag.js';

export {
  generateETag,
  NextServer,
  ComputeJsNextResponse,
  ComputeJsNextRequest,
};

export default createServer;
