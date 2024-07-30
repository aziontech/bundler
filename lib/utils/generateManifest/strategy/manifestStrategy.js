/**
 * ManifestStrategy
 * @class ManifestStrategy
 * @description This class is the base class for all manifest strategies.
 */

class ManifestStrategy {
  /**
   * Generates the manifest based on the configuration.
   * @param {object} config - The configuration object.
   * @param {object} context - The context object.
   * @returns {*} The generated manifest.
   */
  // eslint-disable-next-line no-unused-vars, class-methods-use-this
  generate(config, context) {
    throw new Error('This method should be overridden!');
  }
}

export default ManifestStrategy;
