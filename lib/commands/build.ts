import { checkingProjectTypeJS } from '#utils';
import { feedback } from 'azion/utils/node';
import bundlerEnv from '../env/bundler';
import { build } from '#build';
import { AzionConfig, PresetInput } from 'azion/config';
import { resolvePreset } from '../build/modules/preset';
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
async function buildCommand(
  { entry, bundler, preset, polyfills, worker }: Record<string, any>,
  isFirewall: boolean,
) {
  const vulcanConfig = await bundlerEnv.loadAzionConfig();
  const customConfigurationModule = vulcanConfig?.build || {};
  const vulcanVariables = await bundlerEnv.readBundlerEnv('global');
  // Primeiro obtemos o preset para determinar os outros valores
  let presetInput = getPresetValue(
    customConfigurationModule?.preset,
    preset,
    vulcanVariables as Record<string, unknown>,
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
      customConfigurationModule?.entry,
      entry,
      vulcanVariables?.entry as string,
      './main.js',
    ),
    bundler: getConfigValue(
      customConfigurationModule?.bundler,
      bundler,
      vulcanVariables?.bundler as string,
      'esbuild',
    ),
    polyfills: getConfigValue(
      customConfigurationModule?.polyfills,
      polyfills,
      vulcanVariables?.polyfills as boolean,
      true,
    ),
    worker: getConfigValue(
      customConfigurationModule?.worker,
      worker,
      vulcanVariables?.worker as boolean,
      false,
    ),
    preset: presetInput,
  };

  // Salvamos os valores no arquivo de configuração uma única vez
  await bundlerEnv.createBundlerEnv(configValues);

  const resolvedPreset = await resolvePreset(presetInput);

  if (!resolvedPreset.handler) {
    feedback.info(`Using ${configValues.entry} as entrypoint...`);
    feedback.info("To change the entrypoint, use the '--entry' argument.");
  }

  const config: AzionConfig = {
    build: {
      ...configValues,
    },
  };

  await build({
    config,
    ctx: {
      production: true,
      event: isFirewall ? 'firewall' : 'fetch',
      output: resolve('.edge', 'worker.js'),
      entrypoint: resolve(config.build?.entry || ''),
    },
  });
}

export default buildCommand;
