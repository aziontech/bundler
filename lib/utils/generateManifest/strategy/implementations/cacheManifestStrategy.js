import ManifestStrategy from '../manifestStrategy.js';

/**
 * CacheManifestStrategy
 * @class CacheManifestStrategy
 * @description This class is implementation of the Cache Manifest Strategy.
 */
class CacheManifestStrategy extends ManifestStrategy {
  /**
   * Generates the cache manifest based on the configuration.
   * @param {object} config - The configuration object.
   * @param {object} context - The context object.
   * @returns {object} The generated cache manifest.
   * @throws {Error} When the expression is not purely mathematical.
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  generate(config, context) {
    // Helper function to safely evaluate mathematical expressions
    const evaluateMathExpression = (expression) => {
      if (typeof expression === 'number') {
        return expression;
      }
      if (/^[0-9+\-*/.() ]+$/.test(expression)) {
        // eslint-disable-next-line no-eval
        return eval(expression);
      }
      throw new Error(`Expression is not purely mathematical: ${expression}`);
    };

    const payload = [];
    if (!Array.isArray(config?.cache) || config?.cache.length === 0) {
      return payload;
    }
    config?.cache.forEach((cache) => {
      const maxAgeSecondsBrowser = cache?.browser
        ? evaluateMathExpression(cache.browser.maxAgeSeconds)
        : 0;
      const maxAgeSecondsEdge = cache?.edge
        ? evaluateMathExpression(cache.edge.maxAgeSeconds)
        : 60;

      const cacheSetting = {
        name: cache.name,
        browser_cache_settings: cache?.browser ? 'override' : 'honor',
        browser_cache_settings_maximum_ttl: maxAgeSecondsBrowser,
        cdn_cache_settings: cache?.edge ? 'override' : 'honor',
        cdn_cache_settings_maximum_ttl: maxAgeSecondsEdge,
        enable_caching_for_post: cache?.methods?.post || false,
        enable_caching_for_options: cache?.methods?.options || false,
        enable_query_string_sort: cache?.queryStringSort || false,
      };

      if (cache.cacheByQueryString) {
        cacheSetting.cache_by_query_string =
          cache.cacheByQueryString.option === 'varies'
            ? 'all'
            : cache.cacheByQueryString.option;
        if (
          cache.cacheByQueryString.option === 'whitelist' ||
          cache.cacheByQueryString.option === 'blacklist'
        ) {
          cacheSetting.query_string_fields =
            cache.cacheByQueryString.list || [];
        } else {
          cacheSetting.query_string_fields = [];
        }
      }

      if (cache.cacheByCookie) {
        cacheSetting.cache_by_cookie =
          cache.cacheByCookie.option === 'varies'
            ? 'all'
            : cache.cacheByCookie.option;
        if (
          cache.cacheByCookie.option === 'whitelist' ||
          cache.cacheByCookie.option === 'blacklist'
        ) {
          cacheSetting.cookie_names = cache.cacheByCookie.list || [];
        } else {
          cacheSetting.cookie_names = [];
        }
      }

      payload.push(cacheSetting);
    });
    return payload;
  }
}

export default CacheManifestStrategy;
