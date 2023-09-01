/* eslint-disable max-classes-per-file */
import {
  NodeNextRequest,
  NodeNextResponse,
} from 'next/dist/server/base-http/node.js';

export class ComputeJsNextRequest extends NodeNextRequest {
  constructor(req, client) {
    super(req);
    this.client = client;
  }
}
export class ComputeJsNextResponse extends NodeNextResponse {}
