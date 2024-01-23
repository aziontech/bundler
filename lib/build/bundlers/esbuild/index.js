import * as esbuild from 'esbuild';
import lodash from 'lodash';

import { Messages } from '#constants';
import { debug } from '#utils';

import BundlerBase from '../bundler-base.js';
import AzionEsbuildConfig from './esbuild.config.js';
import ESBuildNodeModulePlugin from './plugins/node-polyfills/index.js';
import ESBuildAzionModulePlugin from './plugins/azion-polyfills/index.js';

/**
 * Class representing an ESBuild bundler, extending BundlerBase.
 */
class Esbuild extends BundlerBase {
  /**
   * Asynchronous method to run the ESBuild bundler.
   */
  async run() {
    let config = lodash.cloneDeep(AzionEsbuildConfig);
    config.entryPoints = [this.builderConfig.entry];

    if (!config.plugins) config.plugins = [];

    // merge config common
    config = super.mergeConfig(config);
    config = this.applyConfig(config);

    try {
      await esbuild.build(config);
    } catch (error) {
      debug.error(error);
      throw Error(Messages.build.error.vulcan_build_failed);
    }
  }

  /**
   * Applies specific configurations to the ESBuild config.
   * @param {object} config - ESBuild configuration object.
   * @returns {object} - Updated ESBuild configuration object.
   */
  applyConfig(config) {
    const updatedConfig = { ...config };
    // use polyfill with useNodePolyfills and preset mode compute
    const useNodePolyfills =
      (this.builderConfig?.useNodePolyfills ||
        this.customConfigPreset?.useNodePolyfills ||
        this.customConfigLocal?.useNodePolyfills) &&
      this.presetMode === 'compute';

    if (!updatedConfig.plugins) updatedConfig.plugins = [];
    if (useNodePolyfills) {
      updatedConfig.plugins.push(ESBuildNodeModulePlugin(globalThis.buildProd));
    }

    // plugin resolve azion:
    updatedConfig.plugins.push(ESBuildAzionModulePlugin(globalThis.buildProd));

    // inject content in worker initial code.
    if (this.builderConfig.contentToInject) {
      const workerInitContent = this.builderConfig.contentToInject;

      if (updatedConfig.banner?.js) {
        updatedConfig.banner.js = `${updatedConfig.banner.js} ${workerInitContent}`;
      } else {
        updatedConfig.banner = { js: workerInitContent };
      }
    }
    return updatedConfig;
  }
}

export default Esbuild;
