/*
 * Copyright Azion
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Fastly, Inc, licensed under the MIT license. See LICENSE file for details.
 */

import {
  ComputeJsNextRequest,
  ComputeJsNextResponse,
} from './server/base-http/compute-js';
import createServer, { NextServer } from './server/next';
import generateETag from './util/etag';

export {
  generateETag,
  NextServer,
  ComputeJsNextResponse,
  ComputeJsNextRequest,
};

export default createServer;
