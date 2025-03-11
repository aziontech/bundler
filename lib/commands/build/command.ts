import { readUserConfig, readStore, writeStore, type BundlerStore } from '#env';
import { build } from 'lib/commands/build/build';
import { AzionConfig } from 'azion/config';
import { resolve } from 'path';
import type { BuildCommandOptions } from './types';
import { resolveConfigPriority, resolvePresetPriority } from './utils';
import { AzionBuild } from 'azion/config';

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
  const userConfig: AzionConfig = (await readUserConfig()) || {};
  const { build: userBuildConfig } = userConfig;

  const bundlerStore: BundlerStore = await readStore();

  let presetInput = resolvePresetPriority({
    inputValue: options.preset,
    fileValue: userBuildConfig?.preset,
    storeValue: bundlerStore.preset,
    defaultValue: undefined,
  });

  const buildConfig = {
    preset: presetInput,
    entry: resolveConfigPriority({
      inputValue: options.entry,
      fileValue: userBuildConfig?.entry,
      storeValue: bundlerStore?.entry,
      defaultValue: undefined,
    }),
    bundler: resolveConfigPriority<'webpack' | 'esbuild'>({
      inputValue: undefined,
      fileValue: userBuildConfig?.bundler,
      storeValue: bundlerStore?.bundler,
      defaultValue: 'esbuild',
    }),
    polyfills: resolveConfigPriority({
      inputValue: userBuildConfig?.polyfills,
      fileValue: options.polyfills,
      storeValue: bundlerStore?.polyfills,
      defaultValue: true,
    }),
    worker: resolveConfigPriority({
      inputValue: userBuildConfig?.worker,
      fileValue: options.worker,
      storeValue: bundlerStore?.worker,
      defaultValue: false,
    }),
  };

  await writeStore(buildConfig);

  const config: AzionConfig = {
    build: {
      ...buildConfig,
    },
  };

  await build({
    config,
    ctx: {
      production: options.production ?? true,
      output: resolve('.edge', 'worker.js'),
      entrypoint: buildConfig.entry ? resolve(buildConfig.entry) : '',
    },
  });
}
