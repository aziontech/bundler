import { join } from 'path';
import { generateTimestamp } from '../../../helpers/build-utils';
import { BuildConfig } from '../../../types/build';

export const createBuildConfig = (config: BuildConfig): BuildConfig => {
  const buildConfig = { ...config };

  // Set build flags
  buildConfig.polyfills = Boolean(config.polyfills);
  buildConfig.worker = Boolean(config.worker);

  // Set paths
  const currentDir = process.cwd();
  const tempFile = `azion-${generateTimestamp()}.temp.${config.preset.name === 'typescript' ? 'ts' : 'js'}`;

  buildConfig.entry = join(currentDir, tempFile);
  buildConfig.output = globalThis.vulcan?.isProduction ? '.edge/worker.js' : '.edge/worker.dev.js';

  return buildConfig;
};
