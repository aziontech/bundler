import { AzionConfig, AzionBuildPreset, BuildContext } from 'azion/config';
import { mergeConfigWithUserOverrides } from './utils';

import {
  writeStore,
  writeUserConfig,
  readUserConfig,
  type BundlerStore,
} from '#env';

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
  config: userConfig,
  preset,
  ctx,
}: EnvironmentParams): Promise<void> => {
  try {
    const { config: presetConfig } = preset;

    /**
     * Merge configurations with the following priority:
     * 1. User config (from azion.config.js)
     * 2. Preset config (from preset module)
     */
    const mergedConfig: AzionConfig = mergeConfigWithUserOverrides(
      presetConfig,
      userConfig,
    );

    /**
     * Include preset name in the config file for user reference.
     * This helps users identify which preset is being used and
     * how to change it if needed.
     */
    if (!mergedConfig.build?.preset) {
      mergedConfig.build = {
        ...mergedConfig.build,
        preset: preset.metadata.name,
        ...(!preset.handler &&
          preset.config.build?.entry && {
            entry: preset.config.build.entry,
          }),
      };
    }

    const hasCustomConfig = await readUserConfig();

    // Create initial config file if none exists
    if (!hasCustomConfig) await writeUserConfig(mergedConfig);

    /**
     * Setup environment store with the following rules:
     * - Always include preset name for framework identification
     * - Include build configurations (bundler, polyfills, worker)
     * - Only include entry point if:
     *   1. User provided an entrypoint AND
     *   2. Preset doesn't have a built-in handler
     */
    const storeConfig: BundlerStore = {
      preset: mergedConfig.build.preset,
      bundler: mergedConfig.build?.bundler,
      polyfills: mergedConfig.build?.polyfills,
      worker: mergedConfig.build?.worker,
      entry: mergedConfig.build.entry,
    };

    await writeStore(storeConfig);
  } catch (error) {
    throw new Error(`Failed to set environment: ${(error as Error).message}`);
  }
};
