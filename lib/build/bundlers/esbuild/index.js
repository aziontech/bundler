import * as esbuild from 'esbuild';

import { debug } from '#utils';
import { Messages } from '#constants';

import AzionEsbuildConfig from './esbuild.config.js';

class Esbuild {
  constructor(customConfig) {
    this.customConfig = customConfig;
  }

  run = async () => {
    const config = AzionEsbuildConfig;
    config.entryPoints = [this.customConfig.entry];

    try {
      await esbuild.build(config);
    } catch (error) {
      debug.error(error);
      throw Error(Messages.build.error.vulcan_build_failed);
    }
  };
}

export default Esbuild;
