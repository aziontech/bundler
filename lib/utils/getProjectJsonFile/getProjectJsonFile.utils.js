import { join } from 'path';
import { readFileSync } from 'fs';

/**
 * Reads json file content
 * @param {string} filePath - path to json file to be readed.
 * @returns {object} - JSON object with file content.
 */
function getProjectJsonFile(filePath) {
  try {
    const packageJsonPath = join(process.cwd(), filePath);
    const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    return packageJson;
  } catch (error) {
    throw Error(`Error getting '${filePath}' file: ${error}`);
  }
}

export default getProjectJsonFile;
