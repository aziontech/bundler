import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Get the version ID from the .azion/VULCAN.env file.
 * The version ID represents a unique identifier for a specific version of the project's code.
 * It is responsible for naming the folder that holds the code within our storage system.
 * During the build process, Vulcan generates a .azion/VULCAN.env file with an
 * automatically generated version ID,
 * which is later used for project deployment and updates.
 * The version ID is also used to fetch the correct assets within the Edge Function.
 * @returns {string|null} The version ID if found, or null if not found.
 */
function getAzionVersionId() {
  let versionId = null;
  const filePath = join(process.cwd(), '.azion', 'VULCAN.env');

  if (existsSync(filePath)) {
    const fileContent = readFileSync(filePath, 'utf8');
    const versionIdMatch = fileContent.match(/VERSION_ID=(.+)/);

    if (versionIdMatch && versionIdMatch[1]) {
      versionId = versionIdMatch[1].trim();
    }
  }

  return versionId;
}

export default getAzionVersionId;
