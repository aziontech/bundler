import { AzionConfig, AzionBuildPreset, BuildContext } from 'azion/config';
import utilsDefault from './utils';

import envDefault from '#env';

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
 *
 * Note: The current implementation uses a temporary solution for edge applications rules.
 * Instead of a proper merge strategy, we check if rules exist and if not, we use the preset's rules.
 * This is a workaround to ensure backward compatibility while we work on a more robust solution
 * for handling edge application configurations. The goal is to make this more flexible and
 * maintainable in future versions.
 */
export const setEnvironment = async ({
  config: userConfig,
  preset,
}: EnvironmentParams): Promise<AzionConfig> => {
  try {
    const { config: presetConfig } = preset;

    /**
     * Merge configurations with the following priority:
     * 1. User config (from azion.config.js)
     * 2. Preset config (from preset module)
     */
    const mergedConfig: AzionConfig = utilsDefault.mergeConfigWithUserOverrides(
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
          userConfig.build?.entry && {
            entry: userConfig.build?.entry,
          }),
      };
    }

    const hasUserConfig = await envDefault.readAzionConfig();

    // Create initial config file if none exists
    if (!hasUserConfig) await envDefault.writeUserConfig(mergedConfig);

    return mergedConfig;
  } catch (error) {
    throw new Error(`Failed to set environment: ${(error as Error).message}`);
  }
};
