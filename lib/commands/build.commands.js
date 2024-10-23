import { Commands } from '#namespaces';
import { checkingProjectTypeJS, feedback } from '#utils';
import vulcan from '../env/vulcan.env.js';

/**
 * Retrieves a configuration value based on priority.
 * Priority order: inputOption, customConfig, vulcanVariable, defaultValue.
 * @param {any} customConfig - Configuration from custom module.
 * @param {any} inputOption - Configuration provided as input.
 * @param {any} vulcanVariable - Configuration from the .azion-bundler file.
 * @param {any} defaultValue - Default value to use if no other configurations are available.
 * @returns {any} The chosen configuration value.
 */
function getConfigValue(
  customConfig,
  inputOption,
  vulcanVariable,
  defaultValue,
) {
  return inputOption ?? customConfig ?? vulcanVariable ?? defaultValue;
}

/**
 * Retrieves a preset configuration value based on priority.
 * Priority order for both name : customConfig, inputOption, vulcanVariable, defaultValue.
 * @param {object} customConfig - Preset configuration from custom module.
 * @param {string} presetName - Preset name provided as input.
 * @param {object} vulcanVariable - Preset configuration from the .azion-bundler file.
 * @param {object} defaultValue - Default preset configuration.
 * @returns {object} The chosen preset configuration with name.
 */
function getPresetValue(
  customConfig,
  presetName,
  vulcanVariable,
  defaultValue,
) {
  const name = getConfigValue(
    customConfig?.name,
    presetName,
    vulcanVariable?.preset,
    defaultValue?.name,
  );
  return { name };
}

/**
 * A command to initiate the build process.
 * This command prioritizes parameters over .azion-bundler file configurations.
 * If a parameter is provided, it uses the parameter value,
 * otherwise, it tries to use the .azion-bundler file configuration.
 * If neither is available, it resorts to default configurations.
 * @memberof Commands
 * @param {object} options - Configuration options for the build command.
 * @param {string} [options.entry] - The entry point file for the build.
 * @param {string} [options.builder] - The name of the Bundler you want to use (Esbuild or Webpack)
 * @param {string} [options.preset] - Preset to be used (e.g., 'javascript').
 * @param {boolean} [options.polyfills] - Whether to use Node.js polyfills.
 * @param {boolean} [options.worker] - This flag indicates that the constructed code inserts its own worker expression, such as addEventListener("fetch") or similar, without the need to inject a provider.
 * @param {boolean} [options.onlyManifest] - Skip build and process. just the manifest.
 * @param {boolean} [isFirewall] - (Experimental) Enable isFirewall for local environment.
 * @returns {Promise<void>} - A promise that resolves when the build is complete.
 * @example
 *
 * buildCommand({
 *   entry: './src/index.js',
 *   preset: { name: 'javascript' },
 *   polyfills: false
 * });
 */
async function buildCommand(
  { entry, builder, preset, polyfills, worker, onlyManifest },
  isFirewall,
) {
  const vulcanConfig = await vulcan.loadAzionConfig();
  const customConfigurationModule = vulcanConfig?.build || {};
  const vulcanVariables = await vulcan.readVulcanEnv('global');

  const config = {
    entry: getConfigValue(
      customConfigurationModule?.entry,
      entry,
      vulcanVariables?.entry,
      (await checkingProjectTypeJS()) ? './main.js' : './main.ts',
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
    polyfills: getConfigValue(
      customConfigurationModule?.polyfills,
      polyfills,
      vulcanVariables?.polyfills,
      true,
    ),
    worker: getConfigValue(
      customConfigurationModule?.worker,
      worker,
      vulcanVariables?.worker,
      false,
    ),
    preset: getPresetValue(
      customConfigurationModule?.preset,
      preset,
      vulcanVariables,
      { name: '' },
    ),
    custom: customConfigurationModule?.custom ?? {},
  };

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
