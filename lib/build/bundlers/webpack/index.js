/* eslint-disable no-param-reassign */
import { promisify } from 'util';
import webpack from 'webpack';
import lodash from 'lodash';

import { feedback, debug, getAbsoluteLibDirPath } from '#utils';
import { Messages } from '#constants';

import AzionWebpackConfig from './webpack.config.js';
import NodePolyfillPlugin from './plugins/node-polyfills/index.js';
import BundlerBase from '../bundler-base.js';

class Webpack extends BundlerBase {
  // eslint-disable-next-line no-useless-constructor
  constructor(builderConfig) {
    super(builderConfig);
  }

  async run() {
    const runWebpack = promisify(webpack);

    let config = lodash.cloneDeep(AzionWebpackConfig);
    config.entry = this.builderConfig.entry;
    config.plugins = [
      new webpack.DefinePlugin({
        AZION_VERSION_ID: JSON.stringify(this.builderConfig.buildId),
        VULCAN_PATH: JSON.stringify(getAbsoluteLibDirPath()),
      }),
      ...config.plugins,
    ];

    config = super.mergeConfig(config);
    config = this.applyConfig(config);

    try {
      const stats = await runWebpack(config);

      const info = stats.toJson();
      if (stats.hasErrors()) {
        info.errors.forEach((msg) => {
          feedback.build.error(msg);
        });
      }
    } catch (error) {
      debug.error(error);
      throw Error(Messages.build.error.vulcan_build_failed);
    }
  }

  applyConfig(config) {
    const updatedConfig = { ...config };
    // inject content in worker initial code.
    if (this.builderConfig.contentToInject) {
      const workerInitContent = this.builderConfig.contentToInject;

      const bannerPluginIndex = updatedConfig.plugins.findIndex(
        (plugin) => plugin instanceof webpack.BannerPlugin,
      );

      if (bannerPluginIndex !== -1) {
        const oldContent =
          updatedConfig.plugins[bannerPluginIndex].options.banner;
        const pluginToRemove = updatedConfig.plugins[bannerPluginIndex];
        updatedConfig.plugins = updatedConfig.plugins.filter(
          (plugin) => plugin !== pluginToRemove,
        );
        updatedConfig.plugins.push(
          new webpack.BannerPlugin({
            banner: `${oldContent} ${workerInitContent}`,
            raw: true,
          }),
        );
      } else {
        updatedConfig.plugins.push(
          new webpack.BannerPlugin({
            banner: workerInitContent,
            raw: true,
          }),
        );
      }
    }

    // use polyfill with useNodePolyfills and preset mode compute
    const useNodePolyfills =
      (this.builderConfig?.useNodePolyfills ||
        this.customConfigPreset?.useNodePolyfills ||
        this.customConfigLocal?.useNodePolyfills) &&
      this.presetMode === 'compute';

    if (useNodePolyfills) {
      updatedConfig.plugins.push(new NodePolyfillPlugin());
    }
    return updatedConfig;
  }
}

export default Webpack;
