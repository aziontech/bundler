/* eslint-disable max-classes-per-file */
// Copyright Joyent and Node contributors. All rights reserved. MIT license.

/**
 * Function that throws unimplemented error
 * @param {string} name - the class name
 */
function unimplemented(name) {
  throw new Error(`Node.js HTTP/2 ${name} is not currently supported`);
}

class Http2Session {
  constructor() {
    unimplemented(this.constructor.name);
  }
}

class ServerHttp2Session {
  constructor() {
    unimplemented(this.constructor.name);
  }
}

class ClientHttp2Session {
  constructor() {
    unimplemented(this.constructor.name);
  }
}

class Http2Stream {
  constructor() {
    unimplemented(this.constructor.name);
  }
}

class ClientHttp2Stream {
  constructor() {
    unimplemented(this.constructor.name);
  }
}

class ServerHttp2Stream {
  constructor() {
    unimplemented(this.constructor.name);
  }
}

class Http2Server {
  constructor() {
    unimplemented(this.constructor.name);
  }
}

class Http2SecureServer {
  constructor() {
    unimplemented(this.constructor.name);
  }
}

class Http2ServerRequest {
  constructor() {
    unimplemented(this.constructor.name);
  }
}

class Http2ServerResponse {
  constructor() {
    unimplemented(this.constructor.name);
  }
}

/**
 * mock function to be used in build bypass
 */
function createServer() {}

/**
 * mock function to be used in build bypass
 */
function createSecureServer() {}

/**
 * mock function to be used in build bypass
 */
function connect() {}

/**
 * mock function to be used in build bypass
 */
function getDefaultSettings() {}

/**
 * mock function to be used in build bypass
 */
function getPackedSettings() {}

/**
 * mock function to be used in build bypass
 */
function getUnpackedSettings() {}

const sensitiveHeaders = Symbol('nodejs.http2.sensitiveHeaders');

const constants = {};

const http2 = {
  Http2Session,
  ServerHttp2Session,
  ClientHttp2Session,
  Http2Stream,
  ClientHttp2Stream,
  ServerHttp2Stream,
  Http2Server,
  Http2SecureServer,
  createServer,
  createSecureServer,
  connect,
  constants,
  getDefaultSettings,
  getPackedSettings,
  getUnpackedSettings,
  sensitiveHeaders,
  Http2ServerRequest,
  Http2ServerResponse,
};

export {
  ClientHttp2Session,
  ClientHttp2Stream,
  Http2SecureServer,
  Http2Server,
  Http2ServerRequest,
  Http2ServerResponse,
  Http2Session,
  Http2Stream,
  ServerHttp2Session,
  ServerHttp2Stream,
  connect,
  constants,
  createSecureServer,
  createServer,
  getDefaultSettings,
  getPackedSettings,
  getUnpackedSettings,
  sensitiveHeaders,
};

export default http2;
