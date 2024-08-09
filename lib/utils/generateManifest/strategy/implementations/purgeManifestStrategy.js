import ManifestStrategy from '../manifestStrategy.js';

/**
 * PurgeManifestStrategy
 * @class PurgeManifestStrategy
 * @description This class is implementation of the Purge Manifest Strategy.
 */
class PurgeManifestStrategy extends ManifestStrategy {
  /**
   * Generates the purge manifest based on the configuration.
   * @param {object} config - The configuration object.
   * @param {object} context - The context object.
   * @returns {object} The generated purge manifest.
   * @throws {Error} When the purge type is not supported.
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  generate(config, context) {
    const payload = [];
    if (!Array.isArray(config?.purge) || config?.purge.length === 0) {
      return payload;
    }
    config?.purge.forEach((purge) => {
      purge?.urls.forEach((value) => {
        if (!value.includes('http://') && !value.includes('https://')) {
          throw new Error(
            'The URL must contain the protocol (http:// or https://).',
          );
        }

        if (purge?.type === 'wildcard' && !value.includes('*')) {
          throw new Error(
            'The URL must not contain the wildcard character (*).',
          );
        }
      });

      const purgeSetting = {
        type: purge.type,
        urls: purge.urls || [],
        method: purge.method || 'delete',
      };

      if (purge?.type === 'cachekey') {
        purgeSetting.layer = purge.layer || 'edge_caching';
      }

      payload.push(purgeSetting);
    });
    return payload;
  }
}

export default PurgeManifestStrategy;
