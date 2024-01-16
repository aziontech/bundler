/* eslint-disable */
/**
 * async_hooks.js
 * AsyncLocalStorage and AsyncResource
 *
 * This polyfill aims to simulate the behavior of AsyncLocalStorage and AsyncResource for the Edge runtime.
 * it may behave differently than Node.js
 *
 * Attention: This polyfill is inserted during local env build (vulcan dev)
 * to ensure import into the local environment, but should not be used in the final artifact.
 * It must be made available by the production runtime.
 *
 * This polyfill was based on the Bun.js implementation
 * https://github.com/oven-sh/bun/blob/main/src/js/node/async_hooks.ts
 */
const asyncHooksEnabled = true;
let asyncContext = [];

function setContext(contextValue) {
  asyncContext[0] = contextValue;
}

function getContext() {
  return asyncContext[0];
}

export class AsyncLocalStorage {
  #disabled = false;

  constructor() {
    if (asyncHooksEnabled) {
      const uid = Math.random().toString(36).slice(2, 8);
      this.__id__ = uid;
    }
  }

  static bind(fn, ...args) {
    return this.snapshot().bind(null, fn, ...args);
  }

  static snapshot() {
    const context = getContext();
    return (fn, ...args) => {
      const prev = getContext();
      setContext(context);
      try {
        return fn(...args);
      } catch (error) {
        throw error;
      } finally {
        setContext(prev);
      }
    };
  }

  enterWith(store) {
    this.#disabled = false;
    const context = getContext();
    if (!context) {
      setContext([this, store]);
      return;
    }
    const length = context.length;
    for (let i = 0; i < length; i += 2) {
      if (context[i] === this) {
        let clone = context.slice();
        clone[i + 1] = store;
        setContext(clone);
        return;
      }
    }
    setContext([...context, this, store]);
  }

  exit(cb, ...args) {
    return this.run(undefined, cb, ...args);
  }

  run(storeValue, callback, ...args) {
    const contextWasAlreadyInit = !getContext();
    const wasDisabled = this.#disabled;
    this.#disabled = false;

    if (contextWasAlreadyInit) {
      setContext([this, storeValue]);
    } else {
      const context = getContext().slice();
      const i = context.indexOf(this);

      if (i > -1) {
        context[i + 1] = storeValue;
      } else {
        context.push(this, storeValue);
      }

      setContext(context);
    }

    try {
      return callback(...args);
    } finally {
      if (!wasDisabled) {
        const originalContext = getContext();
        setContext(originalContext);
      }
    }
  }

  disable() {
    if (this.#disabled) return;
    this.#disabled = true;
    let context = getContext().slice();
    if (context) {
      const length = context.length;
      for (let i = 0; i < length; i += 2) {
        if (context[i] === this) {
          context.splice(i, 2);
          setContext(context.length ? context : undefined);
          break;
        }
      }
    }
  }

  getStore() {
    if (this.#disabled) return;
    const context = getContext();
    if (!context) return;
    const length = context.length;
    for (let i = length - 2; i >= 0; i -= 2) {
      if (context[i] === this) {
        return context[i + 1];
      }
    }
  }
}

export class AsyncResource {
  #snapshot;

  constructor(type, options) {
    if (typeof type !== 'string') {
      throw new TypeError(
        `The "type" argument must be of type string. Received type ${typeof type}`,
      );
    }
    this.#snapshot = getContext();
  }

  emitBefore() {
    return true;
  }

  emitAfter() {
    return true;
  }

  asyncId() {
    return 0;
  }

  triggerAsyncId() {
    return 0;
  }

  emitDestroy() {
    //
  }

  runInAsyncScope(fn, thisArg, ...args) {
    const prev = getContext();
    setContext(this.#snapshot);
    try {
      return fn.apply(thisArg, args);
    } catch (error) {
      throw error;
    } finally {
      setContext(prev);
    }
  }

  bind(fn, thisArg) {
    return this.runInAsyncScope.bind(this, fn, thisArg || this);
  }

  static bind(fn, type, thisArg) {
    type = type || fn.name;
    return new AsyncResource(type || 'bound-anonymous-fn').bind(fn, thisArg);
  }
}

export const asyncWrapProviders = {
  NONE: 0,
  DIRHANDLE: 1,
  DNSCHANNEL: 2,
  ELDHISTOGRAM: 3,
  FILEHANDLE: 4,
  FILEHANDLECLOSEREQ: 5,
  FIXEDSIZEBLOBCOPY: 6,
  FSEVENTWRAP: 7,
  FSREQCALLBACK: 8,
  FSREQPROMISE: 9,
  GETADDRINFOREQWRAP: 10,
  GETNAMEINFOREQWRAP: 11,
  HEAPSNAPSHOT: 12,
  HTTP2SESSION: 13,
  HTTP2STREAM: 14,
  HTTP2PING: 15,
  HTTP2setContextTINGS: 16,
  HTTPINCOMINGMESSAGE: 17,
  HTTPCLIENTREQUEST: 18,
  JSSTREAM: 19,
  JSUDPWRAP: 20,
  MESSAGEPORT: 21,
  PIPECONNECTWRAP: 22,
  PIPESERVERWRAP: 23,
  PIPEWRAP: 24,
  PROCESSWRAP: 25,
  PROMISE: 26,
  QUERYWRAP: 27,
  SHUTDOWNWRAP: 28,
  SIGNALWRAP: 29,
  STATWATCHER: 30,
  STREAMPIPE: 31,
  TCPCONNECTWRAP: 32,
  TCPSERVERWRAP: 33,
  TCPWRAP: 34,
  TTYWRAP: 35,
  UDPSENDWRAP: 36,
  UDPWRAP: 37,
  SIGINTWATCHDOG: 38,
  WORKER: 39,
  WORKERHEAPSNAPSHOT: 40,
  WRITEWRAP: 41,
  ZLIB: 42,
  CHECKPRIMEREQUEST: 43,
  PBKDF2REQUEST: 44,
  KEYPAIRGENREQUEST: 45,
  KEYGENREQUEST: 46,
  KEYEXPORTREQUEST: 47,
  CIPHERREQUEST: 48,
  DERIVEBITSREQUEST: 49,
  HASHREQUEST: 50,
  RANDOMBYTESREQUEST: 51,
  RANDOMPRIMEREQUEST: 52,
  SCRYPTREQUEST: 53,
  SIGNREQUEST: 54,
  TLSWRAP: 55,
  VERIFYREQUEST: 56,
  INSPECTORJSBINDING: 57,
};

export default {
  AsyncLocalStorage,
  asyncWrapProviders,
  AsyncResource,
};
