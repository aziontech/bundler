import { vulcan } from '#env';
import { feedback } from '#utils';

import { Commands } from '#namespaces';

/**
 * Throw a required attribute error.
 * @param {string} arg - attribute that is required
 * @throws {Error} - throws error based on arg
 */
function throwError(arg) {
  throw new Error(`'${arg}' is required.`);
}

/**
 * @function
 * @memberof Commands
 * @description Initializes a new '.vulcan' file.
 * @param {object} options - Configuration options for file initialization.
 * @param {string} options.preset - Used preset.
 * @param {string} options.mode - Used preset mode.
 * @param {string} options.scope - Base path to create the file.
 */
async function initCommand({ preset, mode, scope }) {
  try {
    if (!preset) throwError('preset');
    if (!mode) throwError('mode');
    if (!scope) throwError('scope');

    await vulcan.createVulcanEnv({ preset, mode }, scope);

    feedback.info(`'.vulcan file created!'`);
  } catch (error) {
    feedback.error(`Error creating '.vulcan' file: ${error.message}`);
    process.exit(1);
  }
}

export default initCommand;
