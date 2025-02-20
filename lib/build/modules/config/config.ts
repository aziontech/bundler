import { join } from 'path';
import { generateTimestamp } from '#utils';
import { AzionConfig } from 'azion/config';

export const createBuildConfig = (config: AzionConfig): AzionConfig => {
  const azionConfig = { ...config };

  // Set build flags
  azionConfig.build.polyfills = Boolean(azionConfig.build.polyfills);
  azionConfig.build.worker = Boolean(azionConfig.build.worker);

  // Set paths
  const currentDir = process.cwd();
  const isTypescriptPreset =
    typeof azionConfig.build.preset === 'string' &&
    azionConfig.build.preset === 'typescript';
  const tempFile = `azion-${generateTimestamp()}.temp.${isTypescriptPreset ? 'ts' : 'js'}`;

  azionConfig.build.entry = join(currentDir, tempFile);

  return azionConfig;
};
