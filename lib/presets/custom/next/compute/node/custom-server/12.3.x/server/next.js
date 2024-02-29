/*
 * Copyright Azion
 * Licensed under the MIT license. See LICENSE file for details.
 *
 * Portions of this file Copyright Fastly, Inc, licensed under the MIT license. See LICENSE file for details.
 */

import { toComputeResponse, toReqRes } from '@fastly/http-compute-js';

// imports user project dependencies (node_modules)
/* eslint-disable */
import accepts from 'accepts';
import { PHASE_PRODUCTION_SERVER } from 'next/constants';
/* eslint-enable */

import {
  ComputeJsNextRequest,
  ComputeJsNextResponse,
} from './base-http/compute-js.js';
import loadConfig from './config.js';
import NextComputeJsServer from './next-compute-js-server.js';

export class NextServer {
  constructor(options) {
    this.options = options;
    this.server = null;
  }

  async getServer() {
    if (this.server != null) {
      return this.server;
    }
    const conf = await loadConfig(
      PHASE_PRODUCTION_SERVER,
      this.options.computeJs.assets,
      this.options.dir ?? '.',
      this.options.conf,
    );

    this.server = new NextComputeJsServer({
      ...this.options,
      conf,
    });

    return this.server;
  }

  async getRequestHandler() {
    return (await this.getServer()).getRequestHandler();
  }

  /* eslint-disable */
  getUpgradeHandler() {
    return async (req, socket, head) => {
      throw new Error('Upgrading not supported');
    };
  }
  /* eslint-enable */

  async handleFetchEvent(event) {
    const { req, res } = toReqRes(event.request);

    const nextRequest = new ComputeJsNextRequest(req, event.client);
    const nextResponse = new ComputeJsNextResponse(res);
    const requestHandler = await this.getRequestHandler();
    await requestHandler(nextRequest, nextResponse);

    let computeResponse;

    // If the handler has set a response directly, then use it
    if (nextResponse.overrideResponse != null) {
      computeResponse = nextResponse.overrideResponse;
    } else {
      computeResponse = await toComputeResponse(res);
    }

    if (nextResponse.compress && computeResponse.body != null) {
      const accept = accepts(req);
      const encoding = accept.encodings(['gzip', 'deflate']);
      if (encoding) {
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

/**
 * Create and returns an Next Server
 * @param {object} options next server options
 * @returns {NextComputeJsServer} a next server instance
 */
export default async function createServer(options) {
  const server = new NextServer(options);
  await server.getServer(); // In C@E there is no sense in lazy loading this
  return server;
}
