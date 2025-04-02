import { SUPPORTED_BUNDLERS, BUNDLER } from '#constants';
import { AzionConfig, AzionBuildPreset } from 'azion/config';
import type { BuildConfiguration, BuildEntryPoint } from 'azion/config';
import { createPathEntriesMap, validateEntryPoints } from './utils';

export const setupBuildConfig = async (
  azionConfig: AzionConfig,
  preset: AzionBuildPreset,
  production: boolean,
): Promise<BuildConfiguration> => {
  // Get user entry path from config if provided
  let resolvedEntryPathsMap: Record<string, string> = {};

  const userEntryPath: BuildEntryPoint | undefined = azionConfig.build?.entry;

  if (userEntryPath) {
    await validateEntryPoints(userEntryPath);
    resolvedEntryPathsMap = await createPathEntriesMap({
      entry: userEntryPath,
      ext: preset.metadata.ext ?? BUNDLER.DEFAULT_OUTPUT_EXTENSION,
      production,
    });
  }

  if (!userEntryPath && preset.handler) {
    resolvedEntryPathsMap = await createPathEntriesMap({
      entry: BUNDLER.DEFAULT_HANDLER_FILENAME,
      ext: preset.metadata.ext ?? BUNDLER.DEFAULT_OUTPUT_EXTENSION,
      production,
    });
  }

  if (!userEntryPath && !preset.handler && preset.config.build?.entry) {
    resolvedEntryPathsMap = await createPathEntriesMap({
      entry: preset.config.build.entry,
      ext: preset.metadata.ext ?? BUNDLER.DEFAULT_OUTPUT_EXTENSION,
      production,
    });
  }

  if (!userEntryPath && !preset.handler && !azionConfig.build?.entry) {
    throw new Error('No entry point provided. ');
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
    worker: Boolean(azionConfig.build?.worker),
  };
};
