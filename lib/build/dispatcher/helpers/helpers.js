import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  promises as fsPromises,
  existsSync,
} from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Get the path corresponding to a specific alias defined in the package.json.
 * @param {string} alias - The desired alias.
 * @param {string} vulcanRootPath - vulcan lib path
 * @param {boolean} isWindows - Indicates that user is using in windows
 * @returns {string} The path corresponding to the alias.
 */
function getAliasPath(alias, vulcanRootPath, isWindows) {
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
   * @param {boolean} isWindows - The boolean value indicates whether the current OS is Windows.
   */
function createDotEnvFile(isWindows) {
  const projectRoot = process.cwd();
  const outputPath = isWindows
    ? fileURLToPath(new URL(`file:///${join(projectRoot, '.edge')}`))
    : join(projectRoot, '.edge');
  const envFilePath = join(outputPath, '.env');

  if (!existsSync(envFilePath)) {
    mkdirSync(outputPath, { recursive: true });
    writeFileSync(envFilePath, '');
  }
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
  try {
    const stats = await fsPromises.stat(filePath);
    return Promise.resolve(stats.isDirectory());
  } catch (error) {
    return Promise.resolve(false);
  }
}

/**
 * Determines if the project uses the CommonJS module system by default.
 * It checks the 'type' key in the 'package.json' file at the project root.
 * If 'type' is 'commonjs' or absent, returns true. Otherwise, returns false.
 * @returns {boolean} True if the project uses CommonJS, false if it uses ES Modules.
 */
function isCommonJS() {
  const packageJsonPath = join(process.cwd(), 'package.json');
  if (existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.type !== 'module'; // Returns true for 'commonjs' or no 'type' specified
  }
  return true; // Default to CommonJS if 'package.json' does not exist or 'type' key is absent
}

/**
 * Dynamically loads a module based on the path, filename, and file format.
 * @param {string} inputpath - The path where the module is located.
 * @param {string} filename - The module's filename without the extension.
 * @param {string} format - The file format (e.g., '.js', '.cjs', '.mjs').
 * @returns {Promise<*>} The imported module or null if no valid module is found.
 */
async function loadModule(inputpath, filename, format) {
  const modulePath = join(inputpath, `${filename}${format}`);

  if (existsSync(modulePath)) {
    const module = await import(modulePath);
    return module.default || module;
  }

  return null;
}

export {
  createDotEnvFile,
  getAliasPath,
  folderExistsInProject,
  loadModule,
  isCommonJS,
};
