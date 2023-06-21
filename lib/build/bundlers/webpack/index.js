import webpack from 'webpack';
import { promisify } from 'util';
import { feedback, debug } from '#utils';
import { Messages } from '#constants';

import AzionWebpackConfig from './webpack.config.js';

class Webpack {
  constructor(customConfig, useNodePolyfills) {
    this.customConfig = customConfig;
    this.useNodePolyfills = useNodePolyfills;
  }

  run = async () => {
    const runWebpack = promisify(webpack);

    const config = AzionWebpackConfig;
    config.entry = this.customConfig.entry;
    config.plugins = [
      new webpack.ProgressPlugin(),
      ...config.plugins,
    ];

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
