import { join } from 'path';
import { readFileSync } from 'fs';

/**
 * Get package version from user project.
 * @param {string} packageName - The depency name.
 * @returns {string} The package version.
 */
function getPackageVersion(packageName) {
  if (!packageName || packageName === '' || packageName === ' ') {
    throw Error('Invalid package name!');
  }

  const packageJsonPath = join(process.cwd(), 'package.json');
  const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);

  if (!packageJson.dependencies || !packageJson.dependencies[packageName]) {
    throw Error(`${packageName} not detected in project dependencies!`);
  }

  return packageJson.dependencies[packageName];
}

export default getPackageVersion;
