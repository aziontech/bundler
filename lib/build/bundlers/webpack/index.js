import { promisify } from 'util';
import webpack from 'webpack';
import { merge } from 'webpack-merge';

import { feedback, debug } from '#utils';
import { Messages } from '#constants';

import AzionWebpackConfig from './webpack.config.js';

class Webpack {
  constructor(builderConfig) {
    this.builderConfig = builderConfig;
    this.customConfig = builderConfig.custom;
  }

  run = async () => {
    const runWebpack = promisify(webpack);

    let config = AzionWebpackConfig;
    config.entry = this.builderConfig.entry;
    config.plugins = [
      new webpack.DefinePlugin({
        AZION_VERSION_ID: JSON.stringify(this.builderConfig.buildId),
      }),
      ...config.plugins,
    ];

    const hasCustomConfig = Object.keys(this.customConfig).length > 0;
    if (hasCustomConfig) {
      config = merge(this.customConfig, config);
    }

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
  };
}

export default Webpack;
