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

    console.log(userConfig);
    console.log(presetConfig);

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

    // ===== TEMPORARY 1 SOLUTION START =====
    /**
     * Defines edge application rules based on presets configuration.
     * This block handles the dynamic replacement of variables in the preset configuration:
     * - Replaces $EDGE_APPLICATION_NAME with actual edge application names from store
     * - Replaces $BUCKET_NAME with corresponding edge storage bucket names
     * Where X is the index of the application in the store.
     * This allows for dynamic configuration of multiple edge applications and their storage buckets.
     */
    if (!mergedConfig.edgeApplications?.[0]?.rules) {
      const store = await envDefault.readStore();
      const configString = JSON.stringify(preset.config?.edgeApplications);

      if (configString) {
        // Get first values from store
        const edgeAppName =
          store.edgeApplications?.[0]?.name || preset.config?.edgeApplications?.[0]?.name || '';
        const bucketName =
          store.edgeStorage?.[0]?.name || preset.config?.edgeStorage?.[0]?.name || '';
        const functionName =
          store.edgeFunctions?.[0]?.name || preset.config?.edgeFunctions?.[0]?.name || '';

        // Defines application rules based on presets, replacing variables with store values
        const replacedConfig = configString
          .replace(/\$EDGE_APPLICATION_NAME/g, edgeAppName)
          .replace(/\$BUCKET_NAME/g, bucketName)
          .replace(/\$EDGE_FUNCTION_NAME/g, functionName);

        mergedConfig.edgeApplications = JSON.parse(replacedConfig);
      }
    }
    // ===== TEMPORARY 1 SOLUTION END =====

    // ===== TEMPORARY 2 SOLUTION START =====
    // In non-experimental mode, we need to set a fixed path for the function
    // This will be removed once multi-entry point support is fully implemented
    if (!globalThis.bundler?.experimental && mergedConfig.edgeFunctions) {
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
        bindings:
          userConfig?.edgeFunctions?.[0]?.bindings || preset.config?.edgeFunctions?.[0]?.bindings,
      });
    }
    // ===== TEMPORARY 2 SOLUTION END =====

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
    const storeConfig: BundlerStore = { ...mergedConfig };

    await envDefault.writeStore(storeConfig);
    return mergedConfig;
  } catch (error) {
    throw new Error(`Failed to set environment: ${(error as Error).message}`);
  }
};
