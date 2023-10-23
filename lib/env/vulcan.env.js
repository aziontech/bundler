import { feedback, debug } from '#utils';
import { Messages } from '#constants';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

/**
 * Creates or updates Vulcan environment variables.
 * @async
 * @param {object} variables - An object containing the environment variables to set.
 * @param {string} [scope='local'] - Can be 'global', 'local', or a custom path.
 * @throws {Error} Throws an error if the environment file cannot be read or written.
 * @example
 * // Set multiple global environment variables
 * createVulcanEnv({ API_KEY: 'abc123', ANOTHER_KEY: 'xyz' }, 'global')
 *   .catch(error => console.error(error));
 */
async function createVulcanEnv(variables, scope = 'global') {
  let basePath;
  switch (scope) {
    case 'global':
      basePath = path.join(process.env.HOME, '.azion');
      break;
    case 'local':
      basePath = path.join(process.cwd());
      break;
    default:
      basePath = scope;
      break;
  }
  const vulcanEnvPath = path.join(basePath, '.vulcan');

  try {
    await fsPromises.mkdir(basePath, { recursive: true });
  } catch (error) {
    debug.error(error);
    feedback.error(Messages.errors.folder_creation_failed(vulcanEnvPath));
    throw error;
  }

  let envData = '';
  try {
    envData = await fsPromises.readFile(vulcanEnvPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      debug.error(error);
      feedback.error(Messages.errors.file_doesnt_exist(vulcanEnvPath));
      throw error;
    }
  }

  Object.entries(variables).forEach(([key, value]) => {
    const variableLine = `${key}=${value}`;
    const variableRegex = new RegExp(`${key}=.+`);

    if (envData.match(variableRegex)) {
      envData = envData.replace(variableRegex, variableLine);
    } else {
      envData += `${variableLine}\n`;
    }
  });

  try {
    await fsPromises.writeFile(vulcanEnvPath, envData);
  } catch (error) {
    debug.error(error);
    feedback.error(Messages.errors.write_file_failed(vulcanEnvPath));
    throw error;
  }
}

/**
 * Reads the .vulcan file and returns an object with the variables and their values.
 * @param {string} [scope='local'] - Can be 'global', 'local', or a custom path.
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
  let basePath;
  switch (scope) {
    case 'global':
      basePath = path.join(process.env.HOME, '.azion');
      break;
    case 'local':
      basePath = path.join(process.cwd());
      break;
    default:
      basePath = scope;
      break;
  }
  const vulcanEnvPath = path.join(basePath, '.vulcan');

  try {
    await fsPromises.access(vulcanEnvPath);
    const fileContents = await fsPromises.readFile(vulcanEnvPath, 'utf8');

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
    feedback.error(Messages.errors.read_file_failed(vulcanEnvPath));
    throw error;
  }
}

/**
 * Loads a custom Vulcan configuration file from the current working directory.
 * @async
 * @returns {Promise<object|null>} A promise that resolves to the custom Vulcan configuration module if it exists, or null otherwise.
 * @throws {Error} Throws an error if there are issues importing the configuration file.
 * @example
 * loadVulcanConfigFile()
 *   .then(config => {
 *     if (config) {
 *       console.log('Custom configuration loaded:', config);
 *     } else {
 *       console.log('No custom configuration found.');
 *     }
 *   })
 *   .catch(error => console.error('Failed to load custom configuration:', error));
 */
async function loadVulcanConfigFile() {
  const buildConfigPath = path.join(process.cwd(), 'vulcan.config.js');
  let vulcanCustomConfig = null;

  if (fs.existsSync(buildConfigPath)) {
    const vulcanCustomConfigModule = await import(`file://${buildConfigPath}`);
    vulcanCustomConfig = vulcanCustomConfigModule.default || {};
  }

  return vulcanCustomConfig;
}

export default { createVulcanEnv, readVulcanEnv, loadVulcanConfigFile };
