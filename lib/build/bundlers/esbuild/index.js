/* eslint-disable no-param-reassign */
import * as esbuild from 'esbuild';

import { debug } from '#utils';
import { Messages } from '#constants';

import AzionEsbuildConfig from './esbuild.config.js';
import { NodeModulesPolyfillPlugin } from './plugins/node-polyfills/index.js';
import BundlerBase from '../bundler-base.js';

class Esbuild extends BundlerBase {
  // eslint-disable-next-line no-useless-constructor
  constructor(builderConfig) {
    super(builderConfig);
  }

  async run() {
    let config = AzionEsbuildConfig;
    config.entryPoints = [this.builderConfig.entry];
    config.define = {
      AZION_VERSION_ID: JSON.stringify(this.builderConfig.buildId),
    };

    config = super.mergeConfig(config);
    this.applyConfig(config);

    try {
      await esbuild.build(config);
    } catch (error) {
      debug.error(error);
      throw Error(Messages.build.error.vulcan_build_failed);
    }
  }

  applyConfig(config) {
    if (
      this.builderConfig.useNodePolyfills ||
      this.customConfigPreset.useNodePolyfills ||
      this.customConfigLocal
    ) {
      if (!config.plugins) config.plugins = [];
      config.plugins = [NodeModulesPolyfillPlugin(), ...config.plugins];
    }

    // inject content in worker initial code.
    if (this.builderConfig.contentToInject) {
      const workerInitContent = this.builderConfig.contentToInject;

      if (config.banner?.js) {
        config.banner.js = `${config.banner.js} ${workerInitContent}`;
      } else {
        config.banner = { js: workerInitContent };
      }
    }
  }
}

export default Esbuild;
