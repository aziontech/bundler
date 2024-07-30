/**
 * ManifestContext
 * @class
 * @description This class is responsible for generating the context of the manifest.
 */
class ManifestContext {
  constructor() {
    this.strategies = {};
  }

  /**
   * Sets the strategy for a given type.
   * @param {string} type - The type of the strategy.
   * @param {object} strategy - The strategy
   * @returns {void}
   */
  setStrategy(type, strategy) {
    this.strategies[type] = strategy;
  }

  /**
   * Generates the context of the manifest.
   * @param {object} config - The configuration object.
   * @param {object} context - The context object.
   * @returns {object} The context object.
   */
  generate(config, context = {}) {
    Object.keys(this.strategies).forEach((key) => {
      context[key] = this.strategies[key].generate(config, context);
    });
    return context;
  }
}

export default ManifestContext;
