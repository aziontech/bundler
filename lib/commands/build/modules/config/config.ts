import { SUPPORTED_BUNDLERS } from '#constants';
import { AzionConfig, AzionBuildPreset } from 'azion/config';
import type { BuildConfiguration, BuildEntryPoint } from 'azion/config';
import { createPathEntriesMap, validateEntryPoints } from './utils';

export const setupBuildConfig = async (
  azionConfig: AzionConfig,
  preset: AzionBuildPreset,
): Promise<BuildConfiguration> => {
  // Get user entry path from config if provided
  let resolvedEntryPathsMap: Record<string, string> = {};

  const userEntryPath: BuildEntryPoint | [] = azionConfig.build?.entry ?? [];
  await validateEntryPoints(userEntryPath);

  if (userEntryPath) {
    resolvedEntryPathsMap = await createPathEntriesMap({
      entry: userEntryPath,
      ext: preset.metadata.ext ?? 'js',
    });
  }

  if (!userEntryPath) {
    resolvedEntryPathsMap = await createPathEntriesMap({
      entry: '.edge/handler.js',
      ext: preset.metadata.ext ?? 'js',
    });
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
