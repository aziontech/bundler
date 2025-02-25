import { AzionConfig, AzionBuildPreset, BuildContext } from 'azion/config';
import { isCommonJS, mergeConfigWithUserOverrides } from './utils';

/* LEGACY MODULE */
import { createAzionConfigFile, createVulcanEnv } from '#env';

interface EnvironmentParams {
  userConfig: AzionConfig; // User configuration from azion.config
  preset: AzionBuildPreset; // Preset module
  ctx: BuildContext; // Build context with environment info
}

/**
 * Sets up the build environment by:
 * 1. Getting preset's base configuration
 * 2. Merging it with user configuration (if exists)
 * 3. Creating config file if needed
 * 4. Setting up Vulcan environment
 */
export const setEnvironment = async ({
  userConfig,
  preset,
  ctx,
}: EnvironmentParams): Promise<void> => {
  try {
    const { config: presetConfig } = preset;

    // Merge configurations (user config takes precedence)
    const mergedConfig: AzionConfig = mergeConfigWithUserOverrides(
      presetConfig,
      userConfig,
    );

    // Create configuration file if user config doesn't exist
    if (!userConfig) {
      await createAzionConfigFile(isCommonJS(), mergedConfig);
    }

    // Setup Vulcan environment
    await createVulcanEnv(
      {
        entry: ctx.entrypoint,
        preset: (preset as AzionBuildPreset).metadata.name,
        bundler: userConfig.build.bundler,
        polyfills: userConfig.build.polyfills,
        worker: userConfig.build.worker,
      },
      'global',
    );
  } catch (error) {
    throw new Error(`Failed to set environment: ${error.message}`);
  }
};
