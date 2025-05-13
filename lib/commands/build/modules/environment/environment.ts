import { AzionConfig, AzionBuildPreset, BuildContext } from 'azion/config';
import utilsDefault from './utils';

import envDefault, { type BundlerStore } from '#env';

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ctx,
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

    // ===== TEMPORARY SOLUTION START =====
    // In non-experimental mode, we need to set a fixed path for the function
    // This will be removed once multi-entry point support is fully implemented
    if (!globalThis.bundler?.experimental) {
      mergedConfig.edgeFunctions = [];
      const bundlerType = mergedConfig.build?.bundler || 'webpack';
      const finalExt = bundlerType === 'webpack' ? '.js' : '';
      const outputFileName = ctx.production ? 'worker' : 'worker.dev';
      const singleOutputPath = `.edge/${outputFileName}${finalExt}`;

      // Add a single function with the fixed path
      mergedConfig.edgeFunctions.push({
        name:
          userConfig?.edgeFunctions?.[0]?.name ||
          preset.config?.edgeFunctions?.[0]?.name ||
          'handler',
        path: singleOutputPath,
      });
    }
    // ===== TEMPORARY SOLUTION END =====

    const hasUserConfig = await envDefault.readUserConfig();

    // Create initial config file if none exists
    if (!hasUserConfig) await envDefault.writeUserConfig(mergedConfig);

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

    await envDefault.writeStore(storeConfig);
    return mergedConfig;
  } catch (error) {
    throw new Error(`Failed to set environment: ${(error as Error).message}`);
  }
};
