import { Commands } from '#namespaces';
import { feedback } from '#utils';
import { vulcan } from '#env';

/**
 * A command to initiate the build process.
 * This command prioritizes parameters over .vulcan file configurations.
 * If a parameter is provided, it uses the parameter value,
 * otherwise, it tries to use the .vulcan file configuration.
 * If neither is available, it resorts to default configurations.
 * @memberof Commands
 * @param {object} options - Configuration options for the build command.
 * @param {string} [options.entry] - The entry point file for the build.
 * @param {string} [options.preset] - Preset to be used (e.g., 'javascript', 'typescript').
 * @param {string} [options.mode] - Mode in which to run the build (e.g., 'deliver', 'compute').
 * @param {boolean} [options.useNodePolyfills] - Whether to use Node.js polyfills.
 * @param {boolean} [options.useOwnWorker] - This flag indicates that the constructed code inserts its own worker expression, such as addEventListener("fetch") or similar, without the need to inject a provider.
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
async function buildCommand({
  entry,
  preset,
  mode,
  useNodePolyfills,
  useOwnWorker,
}) {
  let config = {
    entry,
    preset,
    mode,
    useNodePolyfills,
    useOwnWorker,
  };

  const vulcanVariables = await vulcan.readVulcanEnv('local');

  // If no arguments are provided, use the .vulcan file configurations
  config = {
    entry: entry ?? vulcanVariables?.entry ?? './main.js',
    preset: preset ?? vulcanVariables?.preset ?? 'javascript',
    mode: mode ?? vulcanVariables?.mode ?? 'compute',
    useNodePolyfills:
      useNodePolyfills ?? vulcanVariables?.useNodePolyfills ?? null,
    useOwnWorker: useOwnWorker ?? vulcanVariables?.useOwnWorker ?? null,
  };
  feedback.info(`Using ${config.entry} as entry point by default`);

  const BuildDispatcher = (await import('#build')).default;
  const buildDispatcher = new BuildDispatcher(
    config.preset,
    config.mode,
    config.entry,
    config.useNodePolyfills,
    config.useOwnWorker,
  );

  await buildDispatcher.run();
}

export default buildCommand;
