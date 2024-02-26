import { Commands } from '#namespaces';
import { feedback } from '#utils';
import vulcan from '../env/vulcan.env.js';

/**
 * Retrieves a configuration value based on priority.
 * Priority order: customConfig, inputOption, vulcanVariable, defaultValue.
 * @param {any} customConfig - Configuration from custom module.
 * @param {any} inputOption - Configuration provided as input.
 * @param {any} vulcanVariable - Configuration from the .vulcan file.
 * @param {any} defaultValue - Default value to use if no other configurations are available.
 * @returns {any} The chosen configuration value.
 */
function getConfigValue(
  customConfig,
  inputOption,
  vulcanVariable,
  defaultValue,
) {
  return customConfig ?? inputOption ?? vulcanVariable ?? defaultValue;
}
/**
 * Retrieves a preset configuration value based on priority.
 * Priority order for both name and mode: customConfig, inputOption, vulcanVariable, defaultValue.
 * @param {object} customConfig - Preset configuration from custom module.
 * @param {string} presetName - Preset name provided as input.
 * @param {string} presetMode - Preset mode provided as input.
 * @param {object} vulcanVariable - Preset configuration from the .vulcan file.
 * @param {object} defaultValue - Default preset configuration.
 * @returns {object} The chosen preset configuration with name and mode.
 */
function getPresetValue(
  customConfig,
  presetName,
  presetMode,
  vulcanVariable,
  defaultValue,
) {
  const name = getConfigValue(
    customConfig?.name,
    presetName,
    vulcanVariable?.preset,
    defaultValue?.name,
  );
  const mode = getConfigValue(
    customConfig?.mode,
    presetMode,
    vulcanVariable?.mode,
    defaultValue?.mode,
  );
  return { name, mode };
}

/**
 * A command to initiate the build process.
 * This command prioritizes parameters over .vulcan file configurations.
 * If a parameter is provided, it uses the parameter value,
 * otherwise, it tries to use the .vulcan file configuration.
 * If neither is available, it resorts to default configurations.
 * @memberof Commands
 * @param {object} options - Configuration options for the build command.
 * @param {string} [options.entry] - The entry point file for the build.
 * @param {string}[options.builder] - The name of the Bundler you want to use (Esbuild or Webpack)
 * @param {string} [options.preset] - Preset to be used (e.g., 'javascript', 'typescript').
 * @param {string} [options.mode] - Mode in which to run the build (e.g., 'deliver', 'compute').
 * @param {boolean} [options.useNodePolyfills] - Whether to use Node.js polyfills.
 * @param {boolean} [options.useOwnWorker] - This flag indicates that the constructed code inserts its own worker expression, such as addEventListener("fetch") or similar, without the need to inject a provider.
 * @param {boolean} [isFirewall] - (Experimental) Enable isFirewall for local environment.
 * @returns {Promise<void>} - A promise that resolves when the build is complete.
 * @example
 *
 * buildCommand({
 *   entry: './src/index.js',
 *   preset: 'javascript',
 *   mode: 'compute',
 *   useNodePolyfills: false
 * });
 */
async function buildCommand(
  { entry, builder, preset, mode, useNodePolyfills, useOwnWorker },
  isFirewall,
) {
  const customConfigurationModule = await vulcan.loadVulcanConfigFile();
  const vulcanVariables = await vulcan.readVulcanEnv('local');

  const config = {
    entry: getConfigValue(
      customConfigurationModule?.entry,
      entry,
      vulcanVariables?.entry,
      preset === 'typescript' ? './main.ts' : './main.js',
    ),
    builder: getConfigValue(
      customConfigurationModule?.builder,
      builder,
      vulcanVariables?.builder,
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
    useNodePolyfills: getConfigValue(
      customConfigurationModule?.useNodePolyfills,
      useNodePolyfills,
      vulcanVariables?.useNodePolyfills,
      false,
    ),
    useOwnWorker: getConfigValue(
      customConfigurationModule?.useOwnWorker,
      useOwnWorker,
      vulcanVariables?.useOwnWorker,
      false,
    ),
    preset: getPresetValue(
      customConfigurationModule?.preset,
      preset,
      mode,
      vulcanVariables,
      { name: 'javascript', mode: 'compute' },
    ),
    custom: customConfigurationModule?.custom ?? {},
  };

  if (
    config.preset.name === 'javascript' ||
    config.preset.name === 'typescript'
  ) {
    feedback.info(`Using ${config.entry} as entrypoint...`);
  }

  const BuildDispatcher = (await import('#build')).default;
  const buildDispatcher = new BuildDispatcher(config, undefined, isFirewall);

  await buildDispatcher.run();
}

export default buildCommand;
