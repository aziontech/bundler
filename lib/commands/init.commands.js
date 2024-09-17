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
 * @description Initializes a new 'temporary store' file.
 * @param {object} options - Configuration options for file initialization.
 * @param {string} options.preset - Used preset.
 */
async function initCommand({ preset, scope }) {
  try {
    if (!preset) throwError('preset');
    if (!scope) throwError('scope');

    await vulcan.createVulcanEnv({ preset }, scope);

    feedback.info(`'temporary store file created!'`);
  } catch (error) {
    feedback.error(`Error creating temporary store file: ${error.message}`);
    process.exit(1);
  }
}

export default initCommand;
