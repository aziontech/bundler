import { join } from 'path';
import { generateTimestamp } from '#utils';
import { AzionConfig } from 'azion/config';

export const resolveBuildConfig = (config: AzionConfig): AzionConfig => {
  const azionConfig = { ...config };
  const currentDir = process.cwd();

  // Set build flags
  azionConfig.build.polyfills = Boolean(azionConfig.build.polyfills);
  azionConfig.build.worker = Boolean(azionConfig.build.worker);

  // Set paths
  const isTypescriptPreset =
    typeof azionConfig.build.preset === 'string' &&
    azionConfig.build.preset === 'typescript';

  const tempFile = `azion-${generateTimestamp()}.temp.${isTypescriptPreset ? 'ts' : 'js'}`;

  azionConfig.build.entry = join(currentDir, tempFile);

  return azionConfig;
};
