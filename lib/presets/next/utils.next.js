import { readFile, access, constants } from 'fs/promises';
import { join, resolve } from 'path';

import { feedback } from '#utils';

/**
 * Get a project manifest generated after build
 * @param {string} file - file name
 * @returns {object} - the manifest
 */
async function readManifestFile(file) {
  const manifestPath = resolve(process.cwd(), '.next', file);
  const manifest = await readFile(manifestPath, 'utf-8');

  return JSON.parse(manifest);
}

/**
 * Check if a file exists
 * @param {string} path - file path
 * @returns {boolean} indicates if exists or not
 */
async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
  } catch (err) {
    // file does not exists
    if (err.code === 'ENOENT') {
      return false;
    }
    // other error cases
    feedback.prebuild.error('Error reading file:', err);
    throw err;
  }

  return true;
}

/**
 * Get next config file
 * @returns {object} - next config as a JSON
 */
async function getNextConfig() {
  try {
    let configFile = null;
    const jsConfigExists = await fileExists('next.config.js');
    const mjsConfigExists = await fileExists('next.config.mjs');
    if (jsConfigExists) {
      configFile = 'next.config';
    } else if (mjsConfigExists) {
      configFile = 'next.config.mjs';
    } else {
      feedback.prebuild.info('Nextjs config file does not exists!');
      return null;
    }

    const configPath = join(process.cwd(), configFile);
    const configModule = await import(configPath);

    return configModule.default;
  } catch (error) {
    throw Error('Error reading next config file:', error);
  }
}

export { readManifestFile, getNextConfig };
