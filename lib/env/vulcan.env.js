import { feedback, debug } from '#utils';
import { Messages } from '#constants';
import fs from 'fs/promises';
import path from 'path';

/**
 * Create or update the Vulcan environment file with the specified name and value.
 * @param {string} name - The name of the variable.
 * @param {string} value - The value of the variable.
 */
async function createVulcanEnv(name, value) {
  const azionDirPath = path.join(process.env.HOME, '.azion');
  const vulcanEnvPath = path.join(azionDirPath, 'vulcan.env');

  // Create the .azion folder if it doesn't exist
  try {
    await fs.mkdir(azionDirPath, { recursive: true });
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
    // Ignore error if the file doesn't exist
    if (error.code !== 'ENOENT') {
      debug.error(error);
      feedback.error(Messages.errors.file_doesnt_exist(vulcanEnvPath));
      throw error;
    }
  }

  // Update or add the variable to the environment data
  const variableLine = `${name}=${value}`;
  const variableRegex = new RegExp(`${name}=.+`);

  if (envData.match(variableRegex)) {
    envData = envData.replace(variableRegex, variableLine);
  } else {
    envData += `${variableLine}\n`;
  }

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
 * Reads the vulcan.env file and returns an object with the variables and their values.
 * @returns {object|null} An object with the variables and their values,
 * or null if the file doesn't exist.
 */
async function readVulcanEnv() {
  const vulcanEnvPath = path.join(process.env.HOME, '.azion', 'vulcan.env');

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
