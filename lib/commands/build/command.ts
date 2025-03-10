import {
  readUserConfig,
  readStore,
  createStore,
  type BundlerStore,
} from '#env';
import { build } from 'lib/commands/build/build';
import { AzionConfig, PresetInput } from 'azion/config';
import { resolve } from 'path';
import { BuildCommandOptions } from './types';

/**
 * Retrieves a configuration value based on priority.
 * Priority order: inputOption, userConfig, storeValue, defaultValue.
 */
function getConfigValue<T>(
  inputOption: T | undefined,
  userConfig: T | undefined,
  storeValue: T | undefined,
  defaultValue: T | undefined,
): T | undefined {
  return inputOption ?? userConfig ?? storeValue ?? defaultValue;
}

/**
 * Retrieves a preset configuration value based on priority.
 * Priority order: inputOption, userConfig, storeValue, defaultValue
 */
function getPresetValue(
  inputOption: string | undefined,
  userPreset: PresetInput | undefined,
  storeValue: PresetInput | undefined,
  defaultValue: string | undefined,
): PresetInput | undefined {
  // If userPreset is an AzionBuildPreset object, return it with highest priority
  if (typeof userPreset === 'object' && userPreset.metadata?.name) {
    return userPreset;
  }

  // If store has a preset object, return it with second priority
  if (typeof storeValue === 'object' && storeValue.metadata?.name) {
    return storeValue;
  }

  // Otherwise, handle as string values with standard priority order
  return getConfigValue(inputOption, userPreset, storeValue, defaultValue);
}

/**
 * A command to initiate the build process.
 * This command prioritizes parameters over .azion-bundler file configurations.
 * If a parameter is provided, it uses the parameter value,
 * otherwise, it tries to use the .azion-bundler file configuration.
 * If neither is available, it resorts to default configurations.
 * @example
 *
 * buildCommand({
 *   entry: './src/index.js',
 *   preset: { name: 'javascript' },
 *   polyfills: false
 * });
 */
export async function buildCommand(options: BuildCommandOptions) {
  // Read user config, defaulting to empty object if file doesn't exist
  const { build: userBuildConfig = {} } = (await readUserConfig()) || {};

  const bundlerStore: BundlerStore = await readStore();

  // Get preset with auto-detection as fallback
  let presetInput = getPresetValue(
    options.preset,
    userBuildConfig?.preset,
    bundlerStore.preset,
    undefined,
  );

  const configValues = {
    entry: getConfigValue(
      options.entry,
      userBuildConfig?.entry,
      bundlerStore?.entry,
      undefined,
    ),
    bundler: getConfigValue(
      userBuildConfig?.bundler,
      undefined,
      bundlerStore?.bundler,
      'esbuild',
    ),
    polyfills: getConfigValue(
      userBuildConfig?.polyfills,
      options.polyfills,
      bundlerStore?.polyfills,
      true,
    ),
    worker: getConfigValue(
      userBuildConfig?.worker,
      options.worker,
      bundlerStore?.worker,
      false,
    ),
    preset: presetInput,
  };
  await createStore(configValues);

  const config: AzionConfig = {
    build: {
      ...configValues,
    },
  };

  await build({
    config,
    ctx: {
      production: options.production ?? true,
      output: resolve('.edge', 'worker.js'),
      entrypoint: resolve(config.build?.entry || ''),
    },
  });
}
