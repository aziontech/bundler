import { AzionConfig, AzionBuildPreset } from 'azion/config';
import { BuildConfiguration } from 'azion/config';
import { createTempEntryMap } from './utils';
export const setupBuildConfig = (
  azionConfig: AzionConfig,
  preset: AzionBuildPreset,
): BuildConfiguration => {
  const entryPathsMap: Record<string, string> = createTempEntryMap({
    entry: azionConfig.build?.entry,
    ext: preset.metadata.ext || 'js',
  });

  const buildConfigSetup: BuildConfiguration = {
    ...azionConfig.build,
    entry: entryPathsMap,
    bundler:
      azionConfig.build?.bundler || preset.config.build?.bundler || 'esbuild',
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
