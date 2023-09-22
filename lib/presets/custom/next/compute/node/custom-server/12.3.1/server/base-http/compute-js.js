/*
 * Copyright Azion
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Fastly, Inc, licensed under the MIT license. See LICENSE file for details.
 */

import {
  NodeNextRequest,
  NodeNextResponse,
} from 'next/dist/server/base-http/node';

export class ComputeJsNextRequest extends NodeNextRequest {
  constructor(req, client) {
    super(req);
    this.client = client;
  }
}
export class ComputeJsNextResponse extends NodeNextResponse {}
