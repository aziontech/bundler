import { readAzionConfig } from '#env';
import { build } from './build';
import { type AzionConfig } from 'azion/config';
import type { BuildCommandOptions } from './types';
import { cleanDirectory, resolveConfigPriority } from './utils';
import { BUILD_CONFIG_DEFAULTS, DIRECTORIES, type BundlerType } from '#constants';

/**
 * @function buildCommand
 * @description A command to initiate the build process.
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
      skipFrameworkBuild: options.skipFrameworkBuild,
    },
  });
}
