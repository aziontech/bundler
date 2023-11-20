/* eslint-disable no-param-reassign */
import { promisify } from 'util';
import webpack from 'webpack';

import { feedback, debug } from '#utils';
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

    let config = AzionWebpackConfig;
    config.entry = this.builderConfig.entry;
    config.plugins = [
      new webpack.DefinePlugin({
        AZION_VERSION_ID: JSON.stringify(this.builderConfig.buildId),
      }),
      ...config.plugins,
    ];

    config = super.mergeConfig(config);
    this.applyConfig(config);

    try {
      const stats = await runWebpack(config);

      const info = stats.toJson();
      if (stats.hasErrors()) {
        info.errors.forEach((msg) => {
          feedback.build.error(msg);
        });
      }
    } catch (error) {
      console.log(error);
      debug.error(error);
      throw Error(Messages.build.error.vulcan_build_failed);
    }
  }

  applyConfig(config) {
    // inject content in worker initial code.
    if (this.builderConfig.contentToInject) {
      const workerInitContent = this.builderConfig.contentToInject;

      const bannerPluginIndex = config.plugins.findIndex(
        (plugin) => plugin instanceof webpack.BannerPlugin,
      );

      if (bannerPluginIndex !== -1) {
        const oldContent = config.plugins[bannerPluginIndex].options.banner;
        const pluginToRemove = config.plugins[bannerPluginIndex];
        config.plugins = config.plugins.filter(
          (plugin) => plugin !== pluginToRemove,
        );
        config.plugins.push(
          new webpack.BannerPlugin({
            banner: `${oldContent} ${workerInitContent}`,
            raw: true,
          }),
        );
      } else {
        config.plugins.push(
          new webpack.BannerPlugin({
            banner: workerInitContent,
            raw: true,
          }),
        );
      }
    }

    if (
      this.builderConfig.useNodePolyfills ||
      this.customConfigPreset.useNodePolyfills ||
      this.customConfigLocal
    ) {
      config.plugins.push(new NodePolyfillPlugin());
    }
  }
}

export default Webpack;
