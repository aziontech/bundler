import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Get the Vulcan build ID from the process.cwd()/.edge/.env file.
 * The Vulcan build ID represents a unique identifier for a specific version of the project's code.
 * It is responsible for naming the folder that holds the code within our storage system.
 * The build ID is used to fetch the correct assets within the Edge Function.
 * @returns {string|null} The build ID if found, or null if not found.
 */
function getVulcanBuildId() {
  const workersJsFilePath = join(process.cwd(), '.edge', '.env');

  if (existsSync(workersJsFilePath)) {
    const fileContent = readFileSync(workersJsFilePath, 'utf8');
    const buildIdMatch = fileContent.match(/VERSION_ID=(\d+)/);

    if (buildIdMatch && buildIdMatch[1]) {
      return buildIdMatch[1].trim();
    }
  }

  return null;
}

export default getVulcanBuildId;
