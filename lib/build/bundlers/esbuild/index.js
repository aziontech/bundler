import * as esbuild from 'esbuild';
import merge from 'deepmerge';

import { debug } from '#utils';
import { Messages } from '#constants';

import AzionEsbuildConfig from './esbuild.config.js';
import { NodeModulesPolyfillPlugin } from './plugins/node-polyfills/index.js';

class Esbuild {
  constructor(builderConfig) {
    this.builderConfig = builderConfig;
    this.customConfig = builderConfig.custom;
  }

  run = async () => {
    let config = AzionEsbuildConfig;
    config.entryPoints = [this.builderConfig.entry];
    config.define = {
      AZION_VERSION_ID: JSON.stringify(this.builderConfig.buildId),
    };

    const hasCustomConfig = Object.keys(this.customConfig).length > 0;
    if (hasCustomConfig) {
      config = merge(this.customConfig, config);
    }

    if (
      this.builderConfig.useNodePolyfills ||
      this.customConfig.useNodePolyfills
    ) {
      if (!config.plugins) config.plugins = [];

      config.plugins = [NodeModulesPolyfillPlugin(), ...config.plugins];
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
