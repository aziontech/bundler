import webpack from 'webpack';
import { promisify } from 'util';

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
          console.error(msg);
        });

        throw Error('Vulcan build failed!');
      }
    } catch (err) {
      const reason = JSON.stringify(err.details);
      throw Error('Error in Vulcan build:', reason);
    }
  };
}

export default Webpack;
