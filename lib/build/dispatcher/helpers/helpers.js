import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  promises as fsPromises,
} from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the path corresponding to a specific alias defined in the package.json.
 * @param {string} alias - The desired alias.
 * @param vulcanRootPath
 * @param isWindows
 * @returns {string} The path corresponding to the alias.
 */
async function getAliasPath(alias, vulcanRootPath, isWindows) {
  const packageJsonPath = join(vulcanRootPath, 'package.json');
  const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  let aliasPath = packageJson.imports[`#${alias}`];
  aliasPath = aliasPath.replace('./', `${vulcanRootPath}/`);
  if (isWindows) {
    aliasPath = aliasPath.replace(/[\\/]/g, '\\\\');
  }

  return aliasPath;
}

/**
Create a .env file in the build folder with specified parameters.
 * @param {string} buildId - The version ID to write into the .env file.
 * @param {boolean} isWindows - The boolean value indicates whether the current OS is Windows.
 */
function createDotEnvFile(buildId, isWindows) {
  const projectRoot = process.cwd();
  console.log(`Project root: ${projectRoot}`);
  const outputPath = isWindows
    ? fileURLToPath(new URL(`file:///${join(projectRoot, '.edge')}`))
    : join(projectRoot, '.edge');
  const envFilePath = join(outputPath, '.env');
  console.log(`Creating .env file in ${envFilePath}`);
  const envContent = [`VERSION_ID=${buildId}`].join('\n');

  mkdirSync(outputPath, { recursive: true });
  writeFileSync(envFilePath, envContent);
}

/**
 * The function checks if a folder exists in the current project directory.
 * @param {string} folder  - The `folder` parameter is a string that
 * represents the name of the folder you want to check if it exists in the current project.
 * @returns {Promise<boolean>} The boolean value indicates whether the
 * specified folder exists in the current project directory.
 */
async function folderExistsInProject(folder) {
  const filePath = join(process.cwd(), folder);
  console.log(`Checking if ${filePath} exists`);
  try {
    const stats = await fsPromises.stat(filePath);
    return Promise.resolve(stats.isDirectory());
  } catch (error) {
    return Promise.resolve(false);
  }
}

export { createDotEnvFile, getAliasPath, folderExistsInProject };
