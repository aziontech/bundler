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
    config = this.applyConfig(config);

    try {
      await esbuild.build(config);
    } catch (error) {
      debug.error(error);
      throw Error(Messages.build.error.vulcan_build_failed);
    }
  }

  async applyConfig(config) {
    const modifyConfig = { ...config };
    if (
      this.builderConfig.useNodePolyfills ||
      this.customConfigPreset.useNodePolyfills ||
      this.customConfigLocal
    ) {
      if (!modifyConfig.plugins) modifyConfig.plugins = [];
      modifyConfig.plugins = [
        NodeModulesPolyfillPlugin(),
        ...modifyConfig.plugins,
      ];
    }

    // inject content in worker initial code.
    if (this.builderConfig.contentToInject) {
      const workerInitContent = this.builderConfig.contentToInject;

      if (modifyConfig.banner?.js) {
        modifyConfig.banner.js = `${modifyConfig.banner.js} ${workerInitContent}`;
      } else {
        modifyConfig.banner = { js: workerInitContent };
      }
    }
    return modifyConfig;
  }
}

export default Esbuild;
