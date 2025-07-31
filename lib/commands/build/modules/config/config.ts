import { SUPPORTED_BUNDLERS, BUNDLER } from '#constants';
import { AzionConfig, AzionBuildPreset } from 'azion/config';
import type { BuildConfiguration, BuildEntryPoint } from 'azion/config';
import { createPathEntriesMap } from './utils';

export const setupBuildConfig = async (
  azionConfig: AzionConfig,
  preset: AzionBuildPreset,
  production: boolean,
): Promise<BuildConfiguration> => {
  // Get user entry path from config if provided
  let resolvedEntryPathsMap: Record<string, string> = {};

  const userEntryPath: BuildEntryPoint | undefined = azionConfig.build?.entry;

  const resolveEntryPaths = async (entry: BuildEntryPoint) => {
    const entryPathsMap = await createPathEntriesMap({
      entry,
      ext: preset.metadata.ext ?? BUNDLER.DEFAULT_OUTPUT_EXTENSION,
      production,
      bundler:
        azionConfig.build?.bundler ?? preset.config.build?.bundler ?? SUPPORTED_BUNDLERS.DEFAULT,
    });

    return entryPathsMap;
  };

  if (userEntryPath) {
    resolvedEntryPathsMap = await resolveEntryPaths(userEntryPath);
  } else if (preset.config.build?.entry) {
    resolvedEntryPathsMap = await resolveEntryPaths(preset.config.build.entry);
  } else if (preset.handler) {
    resolvedEntryPathsMap = await resolveEntryPaths(BUNDLER.DEFAULT_HANDLER_FILENAME);
  }

  if (Object.keys(resolvedEntryPathsMap).length === 0) {
    const defaultEntry = preset.config.build?.entry
      ? `(default is "${preset.config.build.entry}")`
      : '';

    throw new Error(
      `No entry point found ${defaultEntry}. Please specify one using --entry or create a default entry file in your project.`,
    );
  }

  return {
    ...azionConfig.build,
    entry: resolvedEntryPathsMap,
    bundler:
      azionConfig.build?.bundler ?? preset.config.build?.bundler ?? SUPPORTED_BUNDLERS.DEFAULT,
    preset,
    setup: {
      contentToInject: undefined,
      defineVars: {},
    },
    polyfills: Boolean(azionConfig.build?.polyfills),
  };
};
