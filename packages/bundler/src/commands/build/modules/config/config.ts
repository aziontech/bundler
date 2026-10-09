import { SUPPORTED_BUNDLERS, BUNDLER } from '../../../../constants';
import { resolveApiVersion, AzionConfig, AzionBuildPreset } from '@aziontech/config';
import type { BuildConfiguration, BuildEntryPoint } from '@aziontech/config';
import { resolvePresetBuild } from '../preset/preset-build';
import { createPathEntriesMap } from './utils';

export const setupBuildConfig = async (
  azionConfig: AzionConfig,
  preset: AzionBuildPreset,
  production: boolean,
): Promise<BuildConfiguration> => {
  // default entry and bundler of the preset for the version of the project
  const presetBuild = resolvePresetBuild(preset, resolveApiVersion(azionConfig));

  // Get user entry path from config if provided
  let resolvedEntryPathsMap: Record<string, string> = {};

  const userEntryPath: BuildEntryPoint | undefined = azionConfig.build?.entry;

  const resolveEntryPaths = async (entry: BuildEntryPoint) => {
    const entryPathsMap = await createPathEntriesMap({
      entry,
      ext: preset.metadata.ext ?? BUNDLER.DEFAULT_OUTPUT_EXTENSION,
      production,
      bundler: azionConfig.build?.bundler ?? presetBuild.bundler ?? SUPPORTED_BUNDLERS.DEFAULT,
    });

    return entryPathsMap;
  };

  if (userEntryPath) {
    resolvedEntryPathsMap = await resolveEntryPaths(userEntryPath);
  } else if (presetBuild.entry) {
    resolvedEntryPathsMap = await resolveEntryPaths(presetBuild.entry);
  } else if (preset.handler) {
    resolvedEntryPathsMap = await resolveEntryPaths(BUNDLER.DEFAULT_HANDLER_FILENAME);
  }

  if (Object.keys(resolvedEntryPathsMap).length === 0) {
    const defaultEntry = presetBuild.entry ? `(default is "${presetBuild.entry}")` : '';

    throw new Error(
      `No entry point found ${defaultEntry}. Please specify one using --entry or create a default entry file in your project.`,
    );
  }

  return {
    ...azionConfig.build,
    entry: resolvedEntryPathsMap,
    bundler: azionConfig.build?.bundler ?? presetBuild.bundler ?? SUPPORTED_BUNDLERS.DEFAULT,
    preset,
    setup: {
      contentToInject: undefined,
      defineVars: {},
    },
    polyfills: Boolean(azionConfig.build?.polyfills),
  };
};
