import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * @namespace Utils
 * @function
 * @name getVulcanBuildId
 * @description Fetches the unique build ID for the current project from the
 * .env file in the .edge directory.
 * The build ID is a unique identifier for a specific version of the project's
 * code and is used to fetch the correct assets within the Edge Function.
 * The .edge directory is assumed to be in the same directory where the Node.js
 * process was started (process.cwd()).
 * @returns {string|null} The build ID if found, or null if the .env file doesn'
 * t exist or doesn't contain the VERSION_ID.
 * @example
 * // If the .edge/.env file contains "VERSION_ID=123",
 * this will log "123"
 * console.log(getVulcanBuildId());
 * @example
 * // If the .edge/.env file does not exist or does not contain "VERSION_ID=...",
 * // this will log "null"
 * console.log(getVulcanBuildId());
 */
function getVulcanBuildId() {
  // Define the path to the .env file
  const envFilePath = join(process.cwd(), '.edge', '.env');

  // Define the regular expression to match the build ID
  const VERSION_ID_REGEX = /VERSION_ID=(\d+)/;

  // If the .env file exists, read its contents
  if (existsSync(envFilePath)) {
    const envFileContent = readFileSync(envFilePath, 'utf8');

    // Try to match the build ID in the file's contents
    const buildIdMatch = envFileContent.match(VERSION_ID_REGEX);

    // If a match is found, return the build ID (which is the second item in the match array)
    if (buildIdMatch && buildIdMatch[1]) {
      return buildIdMatch[1].trim();
    }
  }

  // If the .env file doesn't exist or doesn't contain the VERSION_ID, return null
  return null;
}

export default getVulcanBuildId;
