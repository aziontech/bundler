import { feedback } from '#utils';

import { Commands } from '#namespaces';

/**
 * @function
 * @memberof Commands
 * @description A command to initiate the build process.
 * @param {object} options - Configuration options for the build command
 * @param {string} options.entry - The entry point file for the build
 * @param {string} options.preset - Preset to be used (e.g., 'javascript', 'typescript')
 * @param {string} options.mode - Mode in which to run the build (e.g., 'deliver', 'compute')
 * @param {boolean} options.useNodePolyfills - Whether to use Node.js polyfills
 * @returns {Promise<void>} - A promise that resolves when the build is complete
 * @example
 *
 * buildCommand({
 *   entry: './src/index.js',
 *   preset: 'javascript',
 *   mode: 'compute',
 *   useNodePolyfills: false
 * });
 */
async function buildCommand({ entry, preset, mode, useNodePolyfills }) {
  let entryPoint = null;

  if (preset === 'javascript') {
    entryPoint = entry;
    feedback.info('Using main.js as entrypoint by default');
  }
  if (preset === 'typescript') {
    if (entry) {
      entryPoint = entry;
    }
    feedback.info('Using main.ts as entrypoint by default');
    if (!entry) {
      entryPoint = './main.ts';
    }
  }

  const BuildDispatcher = (await import('#build')).default;
  const buildDispatcher = new BuildDispatcher(
    preset,
    mode,
    entryPoint,
    useNodePolyfills,
  );

  await buildDispatcher.run();
}

export default buildCommand;
