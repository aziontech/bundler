import merge from 'lodash.merge';

// TODO: insert docs, test
/**
 * BundlerBase
 */
class BundlerBase {
  constructor(builderConfig) {
    this.builderConfig = builderConfig;
    this.customConfigPreset = builderConfig.custom;
    this.customConfigLocal = builderConfig.localCustom;
  }

  // eslint-disable-next-line class-methods-use-this
  async run() {
    // Implement plugin modification logic here
    // This method can be overridden by subclasses
  }

  mergeConfig = (config = {}) => {
    let mergeConfig = { ...config };
    const hasCustomConfig = Object.keys(this.customConfigPreset).length > 0;
    const hasCustomConfigLocal = Object.keys(this.customConfigLocal).length > 0;
    if (hasCustomConfig || hasCustomConfigLocal) {
      mergeConfig = merge(
        mergeConfig,
        this.customConfigPreset,
        this.customConfigLocal,
      );
    }
    return mergeConfig;
  };

  // eslint-disable-next-line class-methods-use-this
  applyConfig() {
    throw new Error('please implement this config');
  }
}

export default BundlerBase;
