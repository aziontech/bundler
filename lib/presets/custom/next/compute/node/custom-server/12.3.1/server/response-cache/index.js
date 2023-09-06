'use strict';
/*
 * Copyright Fastly, Inc.
 * Licensed under the MIT license. See LICENSE file for details.
 */
Object.defineProperty(exports, '__esModule', { value: true });
/**
 * In this runtime, we always SSR the page, and then let the serve-vercel-build-output
 * layer perform the incremental caching
 */
class ComputeJsResponseCache {
  constructor() {
    this.pendingResponses = new Map();
  }
  get(key, responseGenerator, context) {
    var _a;
    // ensure manual revalidate doesn't block normal requests
    const pendingResponseKey = key ? `${key}-${context.isManualRevalidate ? '1' : '0'}` : null;
    const pendingResponse = pendingResponseKey ? this.pendingResponses.get(pendingResponseKey) : null;
    if (pendingResponse) {
      return pendingResponse;
    }
    let resolver = () => {};
    let rejecter = () => {};
    const promise = new Promise((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
    if (pendingResponseKey) {
      this.pendingResponses.set(pendingResponseKey, promise);
    }
    let resolved = false;
    const resolve = (cacheEntry) => {
      if (pendingResponseKey) {
        // Ensure all reads from the cache get the latest value.
        this.pendingResponses.set(pendingResponseKey, Promise.resolve(cacheEntry));
      }
      if (!resolved) {
        resolved = true;
        resolver(cacheEntry);
      }
    };
    // we keep the previous cache entry around to leverage
    // when the incremental cache is disabled in minimal mode
    if (
      pendingResponseKey &&
      ((_a = this.previousCacheItem) === null || _a === void 0 ? void 0 : _a.key) === pendingResponseKey &&
      this.previousCacheItem.expiresAt > Date.now()
    ) {
      resolve(this.previousCacheItem.entry);
      this.pendingResponses.delete(pendingResponseKey);
      return promise;
    }
    // We wait to do any async work until after we've added our promise to
    // `pendingResponses` to ensure that any other calls will reuse the
    // same promise until we've fully finished our work.
    (async () => {
      try {
        const cacheEntry = await responseGenerator(resolved, false);
        const resolveValue =
          cacheEntry === null
            ? null
            : {
                ...cacheEntry,
                isMiss: true,
              };
        // for manual revalidate wait to resolve until cache is set
        if (!context.isManualRevalidate) {
          resolve(resolveValue);
        }
        if (key && cacheEntry && typeof cacheEntry.revalidate !== 'undefined') {
          this.previousCacheItem = {
            key: pendingResponseKey || key,
            entry: cacheEntry,
            expiresAt: Date.now() + 1000,
          };
        } else {
          this.previousCacheItem = undefined;
        }
        if (context.isManualRevalidate) {
          resolve(resolveValue);
        }
      } catch (err) {
        // while revalidating in the background we can't reject as
        // we already resolved the cache entry so log the error here
        // TODO: bypass temp
        const cacheEntry = await responseGenerator(resolved, false);
        if (cacheEntry) {
          return resolve({
            ...cacheEntry,
            isMiss: true,
          });
        }
        if (resolved) {
          console.error(err);
        } else {
          rejecter(err);
        }
      } finally {
        if (pendingResponseKey) {
          this.pendingResponses.delete(pendingResponseKey);
        }
      }
    })();
    return promise;
  }
}
exports.default = ComputeJsResponseCache;
//# sourceMappingURL=index.js.map
