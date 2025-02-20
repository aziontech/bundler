import { join } from 'path';
import { generateTimestamp } from '#utils';
import { AzionConfig } from 'azion/config';

export const createBuildConfig = (config: AzionConfig): AzionConfig => {
  const buildConfig = { ...config };

  // Set build flags
  buildConfig.build.polyfills = Boolean(buildConfig.build.polyfills);
  buildConfig.build.worker = Boolean(buildConfig.build.worker);

  // Set paths
  const currentDir = process.cwd();
  const isTypescriptPreset =
    typeof buildConfig.build.preset === 'string' &&
    buildConfig.build.preset === 'typescript';
  const tempFile = `azion-${generateTimestamp()}.temp.${isTypescriptPreset ? 'ts' : 'js'}`;

  buildConfig.build.entry = join(currentDir, tempFile);

  return buildConfig;
};
