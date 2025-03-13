import { join } from 'path';
import { generateTimestamp } from '#utils';
import { AzionConfig, AzionBuildPreset } from 'azion/config';
import { BuildConfiguration } from 'azion/config';

export const setupBuildConfig = (
  azionConfig: AzionConfig,
  preset: AzionBuildPreset,
): BuildConfiguration => {
  const fileExtension = `${preset.metadata.ext || 'js'}`;
  const tempFile = `azion-${generateTimestamp()}.temp.${fileExtension}`;

  const buildConfigSetup: BuildConfiguration = {
    ...azionConfig.build,
    entry: join(process.cwd(), tempFile),
    preset,
    setup: {
      contentToInject: undefined,
      defineVars: {},
    },
  };

  // Ensure polyfills and worker are always boolean values
  buildConfigSetup.polyfills = Boolean(azionConfig.build?.polyfills);
  buildConfigSetup.worker = Boolean(azionConfig.build?.worker);

  return buildConfigSetup;
};
