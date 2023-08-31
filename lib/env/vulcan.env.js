import { feedback, debug } from '#utils';
import { Messages } from '#constants';
import fs from 'fs/promises';
import path from 'path';

/**
 * Creates or updates Vulcan environment variables, either at the global or project level.
 * @async
 * @param {object} variables - An object containing the environment variables to set.
 * @param {string} [scope='local'] - Determines the scope of the variable ('global' or 'local').
 * @throws {Error} Throws an error if the environment file cannot be read or written.
 * @example
 * // Set multiple global environment variables
 * createVulcanEnv({ API_KEY: 'abc123', ANOTHER_KEY: 'xyz' }, 'global')
 *   .catch(error => console.error(error));
 */
async function createVulcanEnv(variables, scope = 'global') {
  const basePath = scope === 'global' ? path.join(process.env.HOME, '.azion') : path.join(process.cwd());
  const vulcanEnvPath = path.join(basePath, 'vulcan.env');

  // Create the .azion folder if it doesn't exist
  try {
    await fs.mkdir(basePath, { recursive: true });
  } catch (error) {
    debug.error(error);
    feedback.error(Messages.errors.folder_creation_failed(vulcanEnvPath));
    throw error;
  }

  // Read the existing Vulcan environment file if it exists
  let envData = '';
  try {
    envData = await fs.readFile(vulcanEnvPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      debug.error(error);
      feedback.error(Messages.errors.file_doesnt_exist(vulcanEnvPath));
      throw error;
    }
  }

  // Update or add each variable to the environment data
  Object.entries(variables).forEach(([key, value]) => {
    const variableLine = `${key}=${value}`;
    const variableRegex = new RegExp(`${key}=.+`);

    if (envData.match(variableRegex)) {
      envData = envData.replace(variableRegex, variableLine);
    } else {
      envData += `${variableLine}\n`;
    }
  });

  // Write the updated environment data to the file
  try {
    await fs.writeFile(vulcanEnvPath, envData);
  } catch (error) {
    debug.error(error);
    feedback.error(Messages.errors.write_file_failed(vulcanEnvPath));
    throw error;
  }
}

/**
 * Reads the vulcan.env file, either at the global or project level,
 * and returns an object with the variables and their values.
 * @param {string} [scope='local'] - Determines the scope of the environment
 * file ('global' or 'local').
 * @returns {Promise<object|null>} A promise that resolves to an object with
 * the variables and their values, or null if the file doesn't exist.
 * @throws {Error} Throws an error if the environment file cannot be read.
 * @example
 * // Read global environment variables
 * readVulcanEnv('global')
 *   .then(env => console.log(env))
 *   .catch(error => console.error(error));
 *
 * // Read project-level environment variables
 * readVulcanEnv('local')
 *   .then(env => console.log(env))
 *   .catch(error => console.error(error));
 */
async function readVulcanEnv(scope = 'global') {
  const basePath = scope === 'global' ? path.join(process.env.HOME, '.azion') : path.join(process.cwd());
  const vulcanEnvPath = path.join(basePath, 'vulcan.env');

  try {
    // Check if the vulcan.env file exists
    await fs.access(vulcanEnvPath);

    // Read the file contents
    const fileContents = await fs.readFile(vulcanEnvPath, 'utf8');
    // Parse the variables from the file contents
    const variables = {};
    const variableRegex = /^([^=]+)=(.*)$/gm;
    let match = variableRegex.exec(fileContents);
    while (match !== null) {
      const key = match[1].trim();
      const value = match[2].trim();
      variables[key] = value;
      match = variableRegex.exec(fileContents);
    }

    return variables;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    debug.error(error);
    feedback.error(Messages.errors.write_file_failed(vulcanEnvPath));
    throw error;
  }
}

export default { createVulcanEnv, readVulcanEnv };
