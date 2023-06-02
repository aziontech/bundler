import webpack from 'webpack';
import { promisify } from 'util';

import AzionWebpackConfig from './webpack.config.js';

class WebpackBuilder {
  constructor(customConfig, useNodePolyfills) {
    this.customConfig = customConfig;
    this.useNodePolyfills = useNodePolyfills;
  }

  run = async () => {
    const runWebpack = promisify(webpack);

    const config = AzionWebpackConfig;
    config.entry = this.customConfig.entry;

    try {
      const stats = await runWebpack(config);

      const info = stats.toJson();
      if (stats.hasErrors()) {
        info.errors.forEach((msg) => {
          console.error(msg);
        });

        throw Error('* Webpack build failed !');
      }
    } catch (err) {
      const reason = JSON.stringify(err.details);
      throw Error('* Error in webpack build:', reason);
    }
  };
}

export default WebpackBuilder;
