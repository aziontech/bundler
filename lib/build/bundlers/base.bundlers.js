import merge from 'lodash.merge';

/**
 * Base class for a bundler.
 * @class
 */
class BaseBundlers {
  /**
   * Represents a configuration object.
   * @typedef {object} BuilderConfig
   * @property {string} entry - The entry point for the configuration
   * @property {boolean} polyfills - Indicates if Node polyfills are being used
   * @property {boolean} useOwnWorker - Indicates if a custom worker is being used
   * @property {object} custom - Custom configuration.
   * @property {*} localCustom - Local custom data
   * @property {*} preset - The preset configuration
   * @property {string} contentToInject - Content to inject
   * @property {{[key: string]: string}} defineVars - Define vars on build
   */

  /**
   * @param {BuilderConfig} builderConfig - Constructor configuration.
   */
  constructor(builderConfig) {
    /**
     * Constructor configuration.
     * @type {BuilderConfig}
     */
    this.builderConfig = builderConfig;

    /**
     * Custom configuration from the preset.
     * @type {object}
     */
    this.customConfigPreset = builderConfig.custom;

    /**
     * Local custom configuration.
     * @type {object}
     */
    this.customConfigLocal = builderConfig.localCustom;
  }

  /**
   * Executes the plugin modification logic.
   * This method can be overridden by subclasses.
   * @returns {Promise<void>}
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this
  async run() {
    // Implement plugin modification logic here
    // This method can be overridden by subclasses
    // as it does not require the use of `this`
    // eslint-disable-next-line class-methods-use-this
    throw new Error('Running BaseBundlers run method');
  }

  /**
   * Applies the configuration.
   * @param {object} config - Configuration to be applies.
   * @returns {object} - The apply configuration.
   * @abstract
   */
  // eslint-disable-next-line class-methods-use-this
  applyConfig(config) {
    // The ESLint error is being ignored for this method
    // as it does not require the use of `this`
    return config;
  }

  /**
   * Merges the configuration with the current configuration.
   * @param {object} config - Configuration to be merged.
   * @returns {object} - The merged configuration.
   */
  mergeConfig(config = {}) {
    const hasCustomConfig = Object.keys(this.customConfigPreset).length > 0;
    const hasCustomConfigLocal = Object.keys(this.customConfigLocal).length > 0;
    if (hasCustomConfig || hasCustomConfigLocal) {
      return merge(config, this.customConfigPreset, this.customConfigLocal);
    }
    return config;
  }
}

export default BaseBundlers;
