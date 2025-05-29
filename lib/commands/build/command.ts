import { readUserConfig, readStore, writeStore, type BundlerStore } from '#env';
import { build } from './build';
import { AzionConfig } from 'azion/config';
import type { BuildCommandOptions } from './types';
import { cleanDirectory, resolveConfigPriority, resolvePresetPriority } from './utils';
import { BUILD_CONFIG_DEFAULTS, DIRECTORIES, type BundlerType } from '#constants';

/**
 * A command to initiate the build process.
 * This command prioritizes parameters over .azion-bundler file configurations.
 * If a parameter is provided, it uses the parameter value,
 * otherwise, it tries to use the .azion-bundler file configuration.
 * If neither is available, it resorts to default configurations.
 * @example
 *
 * buildCommand({
 *   entry: './src/index.ts',
 *   preset: 'typescript',
 *   polyfills: false,
 *   worker: true,
 *   bundler: 'webpack',
 * });
 */
export async function buildCommand(options: BuildCommandOptions) {
  const userConfig: AzionConfig = (await readUserConfig()) || {};
  const { build: userBuildConfig } = userConfig;

  /**
   * The store uses the local disk to save configurations,
   * allowing the development environment to run according to
   * the settings defined in the build without having to pass arguments.
   * This is also useful for other system components that don't follow
   * the standard dependency injection flow and need access to configuration.
   */
  const bundlerStore: BundlerStore = await readStore();

  const presetInput = resolvePresetPriority({
    inputValue: options.preset,
    fileValue: userBuildConfig?.preset,
    storeValue: bundlerStore.build?.preset,
    defaultValue: BUILD_CONFIG_DEFAULTS.PRESET,
  });

  const resolvedBuildConfig = {
    preset: presetInput,
    entry: resolveConfigPriority({
      inputValue: options.entry,
      fileValue: userBuildConfig?.entry,
      storeValue: bundlerStore?.build?.entry,
      defaultValue: BUILD_CONFIG_DEFAULTS.ENTRY,
    }),
    bundler: resolveConfigPriority<BundlerType>({
      inputValue: undefined,
      fileValue: userBuildConfig?.bundler,
      storeValue: bundlerStore?.build?.bundler,
      defaultValue: BUILD_CONFIG_DEFAULTS.BUNDLER,
    }),
    polyfills: resolveConfigPriority({
      inputValue: userBuildConfig?.polyfills,
      fileValue: options.polyfills,
      storeValue: bundlerStore?.build?.polyfills,
      defaultValue: BUILD_CONFIG_DEFAULTS.POLYFILLS,
    }),
    worker: resolveConfigPriority({
      inputValue: userBuildConfig?.worker,
      fileValue: options.worker,
      storeValue: bundlerStore?.build?.worker,
      defaultValue: BUILD_CONFIG_DEFAULTS.WORKER,
    }),
  };

  const resolveBundlerStore = (
    userConfig: Partial<AzionConfig>,
    bundlerStore: BundlerStore,
  ): BundlerStore => ({
    edgeStorage: userConfig.edgeStorage || bundlerStore.edgeStorage,
    edgeFunctions: userConfig.edgeFunctions || bundlerStore.edgeFunctions,
    edgeConnectors: userConfig.edgeConnectors || bundlerStore.edgeConnectors,
    workloads: userConfig.workloads || bundlerStore.workloads,
    edgeApplications: userConfig.edgeApplications || bundlerStore.edgeApplications,
  });

  const resolvedStore = resolveBundlerStore(userConfig, bundlerStore);

  const storeObject: BundlerStore = {
    build: resolvedBuildConfig,
    ...resolvedStore,
  };

  await writeStore(storeObject);

  const config: AzionConfig = {
    ...userConfig,
    build: {
      ...resolvedBuildConfig,
      memoryFS: userConfig?.build?.memoryFS,
      extend: userConfig?.build?.extend,
    },
    ...resolvedStore,
  };

  if (options.production) await cleanDirectory([DIRECTORIES.OUTPUT_BASE_PATH]);
  return build({
    config,
    options: {
      production: options.production,
    },
  });
}
