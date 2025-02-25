import { checkingProjectTypeJS } from '#utils';
import { feedback } from 'azion/utils/node';
import bundler from '../env/bundler';

/**
 * Retrieves a configuration value based on priority.
 * Priority order: inputOption, customConfig, bundlerVariable, defaultValue.
 */
function getConfigValue(
  customConfig?: string | boolean | null,
  inputOption?: string | boolean | null,
  bundlerVariable?: string | boolean | null,
  defaultValue?: string | boolean | null,
) {
  return inputOption ?? customConfig ?? bundlerVariable ?? defaultValue;
}

/**
 * Retrieves a preset configuration value based on priority.
 * Priority order for both name : customConfig, inputOption, bundlerVariable, defaultValue.
 */
function getPresetValue(
  customConfig: Record<string, unknown>,
  presetName: string,
  bundlerVariable: Record<string, unknown>,
  defaultValue: Record<string, unknown>,
) {
  const name = getConfigValue(
    customConfig?.name as string,
    presetName,
    bundlerVariable?.preset as string,
    defaultValue?.name as string,
  );
  return { name };
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
  {
    entry,
    builder,
    preset,
    polyfills,
    worker,
    onlyManifest,
  }: Record<string, any>,
  isFirewall: boolean,
) {
  const vulcanConfig = await bundler.loadAzionConfig();
  const customConfigurationModule = vulcanConfig?.build || {};
  const vulcanVariables = await bundler.readBundlerEnv('global');

  const config = {
    entry: getConfigValue(
      customConfigurationModule?.entry,
      entry,
      vulcanVariables?.entry as string,
      (await checkingProjectTypeJS()) === 'javascript'
        ? './main.js'
        : './main.ts',
    ),
    builder: getConfigValue(
      customConfigurationModule?.builder,
      builder,
      vulcanVariables?.builder as string,
      null,
    ),
    memoryFS: {
      injectionDirs: getConfigValue(
        customConfigurationModule?.memoryFS?.injectionDirs,
        null,
        null,
        null,
      ),
      removePathPrefix: getConfigValue(
        customConfigurationModule?.memoryFS?.removePathPrefix,
        null,
        null,
        null,
      ),
    },
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
    preset: getPresetValue(
      customConfigurationModule?.preset,
      preset,
      vulcanVariables as Record<string, unknown>,
      { name: '' },
    ),
    custom: customConfigurationModule?.custom ?? {},
  } as Record<string, any>;

  // If no preset is provided, use the default preset.
  if (config.preset.name === '') {
    config.preset.name = await checkingProjectTypeJS();
    feedback.warn(
      `No preset provided. Using the default preset: ${config.preset.name}. Or you can provide a preset using the --preset argument.`,
    );
  }

  if (
    config.preset.name === 'javascript' ||
    config.preset.name === 'typescript'
  ) {
    feedback.info(`Using ${config.entry} as entrypoint...`);
    feedback.info("To change the entrypoint, use the '--entry' argument.");
  }

  const BuildDispatcher = (await import('#build')).default;
  const buildDispatcher = new BuildDispatcher(config, undefined, isFirewall);

  await buildDispatcher.run(onlyManifest);
}

export default buildCommand;
