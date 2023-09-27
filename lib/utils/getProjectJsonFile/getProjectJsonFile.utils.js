import { join } from 'path';
import { readFileSync } from 'fs';

import { Utils } from '#namespaces';

/**
 * @function
 * @memberof Utils
 * @description Reads json file content
 * @param {string} filePath - path to json file to be readed.
 * @returns {object} - JSON object with file content.
 */
function getProjectJsonFile(filePath) {
  const packageJsonPath = join(process.cwd(), filePath);
  const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);

  return packageJson;
}

export default getProjectJsonFile;
