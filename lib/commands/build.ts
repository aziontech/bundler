import { checkingProjectTypeJS } from '#utils';
import { feedback } from 'azion/utils/node';
import { readUserConfig, readStore, createStore } from '#env';
import { build } from '#build';
import { AzionConfig, PresetInput } from 'azion/config';
import { resolve } from 'path';

/**
 * Retrieves a configuration value based on priority.
 * Priority order: inputOption, customConfig, bundlerVariable, defaultValue.
 */
function getConfigValue<T>(
  customConfig: T | undefined,
  inputOption: T | undefined,
  bundlerVariable: T | undefined,
  defaultValue: T | undefined,
): T | undefined {
  return inputOption ?? customConfig ?? bundlerVariable ?? defaultValue;
}

/**
 * Retrieves a preset configuration value based on priority.
 * Priority order for both name : customConfig, inputOption, bundlerVariable, defaultValue.
 */
function getPresetValue(
  customConfig: Record<string, unknown>,
  presetName: string | undefined,
  bundlerVariable: Record<string, unknown>,
  defaultValue: Record<string, unknown>,
): PresetInput {
  const name =
    getConfigValue(
      customConfig?.name as string,
      presetName,
      bundlerVariable?.preset as string,
      defaultValue?.name as string,
    ) || '';

  return name;
}

/**
 * Build command options received from CLI
 */
interface BuildCommandOptions {
  /**
   * Code entrypoint path
   * @default './main.js' or './main.ts'
   */
  entry?: string;

  /**
   * Preset of build target (e.g., vue, next, javascript)
   */
  preset?: string;

  /**
   * Use node polyfills in build
   * @default true
   */
  polyfills?: boolean;
  /**
   * Indicates that the constructed code inserts its own worker expression
   * @default false
   */
  worker?: boolean;

  /**
   * Build mode
   * @default true
   */
  production?: boolean;
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
async function buildCommand({
  entry,
  preset,
  polyfills,
  worker,
  production = true,
}: BuildCommandOptions) {
  const userConfig = await readUserConfig();
  const userConfigBuild = userConfig?.build || {};

  const bundlerStore = await readStore();
  // Primeiro obtemos o preset para determinar os outros valores
  let presetInput = getPresetValue(
    userConfigBuild?.preset,
    preset,
    bundlerStore as Record<string, unknown>,
    { name: '' },
  );

  if (presetInput === '') {
    const defaultPreset = await checkingProjectTypeJS();
    feedback.warn(
      `No preset provided. Using the default preset: ${defaultPreset}. Or you can provide a preset using the --preset argument.`,
    );
    presetInput = defaultPreset;
  }

  // Obtemos todos os valores de configuração
  const configValues = {
    entry: getConfigValue(
      userConfigBuild?.entry,
      entry,
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
      polyfills,
      bundlerStore?.polyfills as boolean,
      true,
    ),
    worker: getConfigValue(
      userConfigBuild?.worker,
      worker,
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
      production,
      output: resolve('.edge', 'worker.js'),
      entrypoint: resolve(config.build?.entry || ''),
    },
  });
}

export default buildCommand;
