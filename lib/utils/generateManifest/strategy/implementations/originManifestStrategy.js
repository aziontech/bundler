import ManifestStrategy from '../manifestStrategy.js';

/**
 * OriginManifestStrategy
 * @class OriginManifestStrategy
 * @description This class is implementation of the Origin Manifest Strategy.
 */
class OriginManifestStrategy extends ManifestStrategy {
  /**
   * Generates the origin manifest based on the configuration.
   * @param {object} config - The configuration object.
   * @param {object} context - The context object.
   * @returns {object} The generated origin manifest.
   * @throws {Error} When the origin type is not supported.
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  generate(config, context) {
    const payload = [];
    if (!Array.isArray(config?.origin) || config?.origin.length === 0) {
      return payload;
    }
    config?.origin.forEach((origin) => {
      if (origin.type !== 'object_storage' && origin.type !== 'single_origin') {
        throw new Error(
          `Rule setOrigin originType '${origin.type}' is not supported`,
        );
      }
      const originSetting = {
        name: origin.name,
        origin_type: origin.type,
      };

      if (origin.type === 'object_storage') {
        originSetting.bucket = origin.bucket;
        originSetting.prefix = origin.prefix;
      }
      if (origin.type === 'single_origin') {
        originSetting.addresses = origin.addresses?.map((address) => {
          return { address };
        });
        originSetting.host_header = origin.hostHeader;
      }
      payload.push(originSetting);
    });
    return payload;
  }
}

export default OriginManifestStrategy;
