import * as esbuild from 'esbuild';

import { Messages } from '#constants';
import { debug } from '#utils';

import BundlerBase from '../bundler-base.js';
import AzionEsbuildConfig from './esbuild.config.js';
import ESBuildNodeModulePlugin from './plugins/node-polyfills/index.js';

class Esbuild extends BundlerBase {
  async run() {
    let config = AzionEsbuildConfig;
    config.entryPoints = [this.builderConfig.entry];
    config.define = {
      AZION_VERSION_ID: JSON.stringify(this.builderConfig.buildId),
    };

    config = super.mergeConfig(config);
    config = this.applyConfig(config);

    try {
      await esbuild.build(config);
    } catch (error) {
      debug.error(error);
      throw Error(Messages.build.error.vulcan_build_failed);
    }
  }

  applyConfig(config) {
    const updatedConfig = { ...config };
    if (
      this.builderConfig.useNodePolyfills ||
      this.customConfigPreset.useNodePolyfills ||
      this.customConfigLocal
    ) {
      if (!updatedConfig.plugins) updatedConfig.plugins = [];
      updatedConfig.plugins = [
        ESBuildNodeModulePlugin(),
        ...updatedConfig.plugins,
      ];
    }

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
