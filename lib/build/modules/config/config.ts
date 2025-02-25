import { join } from 'path';
import { generateTimestamp } from '#utils';
import { AzionConfig, AzionBuildPreset } from 'azion/config';
import { BuildConfiguration } from 'azion/config';

export const setupBuildConfig = (
  azionConfig: AzionConfig,
  preset: AzionBuildPreset,
): BuildConfiguration => {
  const buildConfigSetup: BuildConfiguration = {
    ...azionConfig.build,
    preset,
  };

  // Ensure polyfills and worker are always boolean values
  buildConfigSetup.polyfills = Boolean(azionConfig.build.polyfills);
  buildConfigSetup.worker = Boolean(azionConfig.build.worker);

  // Set temporary entry file path for bundler
  // This file will be used as the entry point during the build process
  const fileExtension = `.${preset.metadata.ext || 'js'}`;
  const tempFile = `azion-${generateTimestamp()}.temp${fileExtension}`;
  buildConfigSetup.entry = join(process.cwd(), tempFile);

  return buildConfigSetup;
};
