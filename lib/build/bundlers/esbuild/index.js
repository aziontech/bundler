import * as esbuild from 'esbuild';
import merge from 'deepmerge';

import { debug } from '#utils';
import { Messages } from '#constants';

import AzionEsbuildConfig from './esbuild.config.js';
import { NodeModulesPolyfillPlugin } from './plugins/node-polyfills/index.js';

class Esbuild {
  constructor(builderConfig) {
    this.builderConfig = builderConfig;
    this.customConfigPreset = builderConfig.custom;
    this.customConfigLocal = builderConfig.localCustom;
  }

  run = async () => {
    let config = AzionEsbuildConfig;
    config.entryPoints = [this.builderConfig.entry];
    config.define = {
      AZION_VERSION_ID: JSON.stringify(this.builderConfig.buildId),
    };

    const hasCustomConfig = Object.keys(this.customConfigPreset).length > 0;
    if (hasCustomConfig) {
      config = merge(this.customConfigPreset, this.customConfigLocal, config);
    }

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

    try {
      await esbuild.build(config);
    } catch (error) {
      debug.error(error);
      throw Error(Messages.build.error.vulcan_build_failed);
    }
  };
}

export default Esbuild;
