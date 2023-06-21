import { join } from 'path';
import { readFileSync } from 'fs';

/**
 * Reads package.json file content
 * @returns {object} - JSON object with file content
 */
function getProjectPackageJson() {
  try {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    return packageJson;
  } catch (error) {
    throw Error(`Error getting 'package.json' file: ${error}`);
  }
}

export default getProjectPackageJson;
