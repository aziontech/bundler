import { readAzionConfig } from '#env';
import { build } from './build';
import { AzionConfig } from 'azion/config';
import type { BuildCommandOptions } from './types';
import { cleanDirectory, resolveConfigPriority } from './utils';
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
  const userConfig: AzionConfig = (await readAzionConfig()) || {};
  const { build: userBuildConfig } = userConfig;

  const resolvedBuildConfig = {
    preset: resolveConfigPriority({
      inputValue: options.preset,
      fileValue: userBuildConfig?.preset,
      defaultValue: BUILD_CONFIG_DEFAULTS.PRESET,
    }),
    entry: resolveConfigPriority({
      inputValue: options.entry,
      fileValue: userBuildConfig?.entry,
      defaultValue: BUILD_CONFIG_DEFAULTS.ENTRY,
    }),
    bundler: resolveConfigPriority<BundlerType>({
      inputValue: undefined,
      fileValue: userBuildConfig?.bundler,
      defaultValue: BUILD_CONFIG_DEFAULTS.BUNDLER,
    }),
    polyfills: resolveConfigPriority({
      inputValue: userBuildConfig?.polyfills,
      fileValue: options.polyfills,
      defaultValue: BUILD_CONFIG_DEFAULTS.POLYFILLS,
    }),
    worker: resolveConfigPriority({
      inputValue: userBuildConfig?.worker,
      fileValue: options.worker,
      defaultValue: BUILD_CONFIG_DEFAULTS.WORKER,
    }),
  };

  const config: AzionConfig = {
    ...userConfig,
    build: {
      ...resolvedBuildConfig,
      memoryFS: userConfig?.build?.memoryFS,
      extend: userConfig?.build?.extend,
    },
  };

  if (options.production) await cleanDirectory([DIRECTORIES.OUTPUT_BASE_PATH]);
  return build({
    config,
    options: {
      production: options.production,
    },
  });
}
