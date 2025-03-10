import { AzionConfig, AzionBuildPreset, BuildContext } from 'azion/config';
import { mergeConfigWithUserOverrides } from './utils';

/* LEGACY MODULE */
import { createStore, writeUserConfig, readUserConfig } from '#env';

interface EnvironmentParams {
  config: AzionConfig;
  preset: AzionBuildPreset;
  ctx: BuildContext;
}

/**
 * Sets up the build environment by:
 * 1. Getting preset's base configuration
 * 2. Merging it with user configuration (if exists)
 * 3. Creating config file if needed
 * 4. Setting up environment store
 *
 * If no configuration file exists, automatically creates one based on the preset.
 * This establishes the preset's default rules as a starting point, which users
 * can then override in their own configuration. This ensures a consistent base
 * configuration while maintaining flexibility for customization.
 */
export const setEnvironment = async ({
  config,
  preset,
  ctx,
}: EnvironmentParams): Promise<void> => {
  try {
    const { config: presetConfig } = preset;

    // Merge configurations (user config takes precedence)
    const mergedConfig: AzionConfig = mergeConfigWithUserOverrides(
      presetConfig,
      config,
    );

    const hasCustomConfig = await readUserConfig();

    // Create initial config file if none exists
    if (!hasCustomConfig) await writeUserConfig(mergedConfig);

    // Setup environment store
    await createStore({
      entry: ctx.entrypoint,
      preset: preset.metadata.name,
      bundler: config?.build?.bundler,
      polyfills: config?.build?.polyfills,
      worker: config?.build?.worker,
    });
  } catch (error) {
    throw new Error(`Failed to set environment: ${(error as Error).message}`);
  }
};
