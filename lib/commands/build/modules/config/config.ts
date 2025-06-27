import { SUPPORTED_BUNDLERS, BUNDLER, DIRECTORIES } from '#constants';
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

    // ===== TEMPORARY SOLUTION START =====
    // This is a temporary solution to handle the limitation of supporting only one entry point.
    // This is a temporary limitation in Azion CLI that will be resolved in a future release.
    // When experimental mode is not enabled, we'll only use the first entry point
    // and force the output path to be .edge/worker.js (or .edge/worker.dev.js in development mode).
    //
    // TODO: Remove this entire block once multi-entry point support is fully implemented.
    // The original behavior will be restored automatically by just removing this block.
    if (!globalThis.bundler?.experimental) {
      // Get only the first entry point
      const firstOutputPath = Object.keys(entryPathsMap)[0];
      const firstTempPath = entryPathsMap[firstOutputPath];

      // Determine the final extension based on the bundler
      const finalExt =
        (azionConfig.build?.bundler ??
          preset.config.build?.bundler ??
          SUPPORTED_BUNDLERS.DEFAULT) === 'webpack'
          ? '.js'
          : '';

      const outputFileName = production ? 'worker' : 'worker.dev';
      const singleOutputPath = `${DIRECTORIES.OUTPUT_BASE_PATH}/${outputFileName}${finalExt}`;

      // Return only one entry point with the fixed output path
      return { [singleOutputPath]: firstTempPath };
    }
    // ===== TEMPORARY SOLUTION END =====

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
