import { readUserConfig, readStore, createStore } from '#env';
import { build } from 'lib/commands/build/build';
import { AzionConfig, PresetInput } from 'azion/config';
import { resolve } from 'path';

import { BuildCommandOptions } from './types';

/**
 * Retrieves a configuration value based on priority.
 * Priority order: inputOption, userConfig, storeValue, defaultValue.
 */
function getConfigValue<T>(
  userConfig: T | undefined,
  inputOption: T | undefined,
  storeValue: T | undefined,
  defaultValue: T | undefined,
): T | undefined {
  return inputOption ?? userConfig ?? storeValue ?? defaultValue;
}

/**
 * Retrieves a preset configuration value based on priority.
 * Priority order for both name : userConfig, inputOption, storeValue, defaultValue.
 */
function getPresetValue(
  userConfig: Record<string, unknown>,
  presetName: string | undefined,
  storeValue: Record<string, unknown>,
  defaultValue: Record<string, unknown>,
): PresetInput {
  const name =
    getConfigValue(
      userConfig?.name as string,
      presetName,
      storeValue?.preset as string,
      defaultValue?.name as string,
    ) || '';

  return name;
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
  const userConfig = await readUserConfig();
  const userConfigBuild = userConfig?.build || {};

  const bundlerStore = await readStore();
  // Primeiro obtemos o preset para determinar os outros valores
  let presetInput = getPresetValue(
    userConfigBuild?.preset,
    options.preset,
    bundlerStore as Record<string, unknown>,
    { name: '' },
  );

  // Obtemos todos os valores de configuração
  const configValues = {
    entry: getConfigValue(
      userConfigBuild?.entry,
      options.entry,
      bundlerStore?.entry as string,
      undefined,
    ),
    bundler: getConfigValue(
      userConfigBuild?.bundler,
      undefined,
      bundlerStore?.bundler as string,
      'esbuild',
    ),
    polyfills: getConfigValue(
      userConfigBuild?.polyfills,
      options.polyfills,
      bundlerStore?.polyfills as boolean,
      true,
    ),
    worker: getConfigValue(
      userConfigBuild?.worker,
      options.worker,
      bundlerStore?.worker as boolean,
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
