import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  promises as fsPromises,
  existsSync,
} from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import prettier from 'prettier';

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
 * Carrega dinamicamente um módulo com base no caminho, nome do arquivo e formato do arquivo.
 * @param {string} inputpath - O caminho onde o módulo está localizado.
 * @param {string} filename - O nome do arquivo do módulo sem a extensão.
 * @param {string} format - O formato do arquivo (por exemplo, '.js', '.cjs', '.mjs').
 * @returns {Promise<*>} O módulo importado ou null se nenhum módulo válido for encontrado.
 */
async function loadModule(inputpath, filename, format) {
  const modulePath = join(inputpath, `${filename}${format}`);

  if (existsSync(modulePath)) {
    const module = await import(modulePath);
    return module.default || module;
  }

  return null;
}

/**
 * Retrieves the path of the existing Azion configuration file in the current working directory.
 * It checks for files with extensions '.js', '.mjs', or '.cjs'.
 * @returns {Promise<string|null>} The path of the Azion configuration file if it exists, otherwise null.
 */
async function getAzionConfigPath() {
  const rootPath = process.cwd();
  const extensions = ['.js', '.mjs', '.cjs'];
  const filePath = extensions
    .map((ext) => join(rootPath, `azion.config${ext}`))
    .find((path) => existsSync(path));
  return filePath || null;
}

/**
 * Creates an Azion configuration file with the appropriate extension if it does not exist.
 * Uses CommonJS or ES Module format based on the useCommonJS parameter.
 * @param {boolean} useCommonJS - If true, uses the '.cjs' extension and CommonJS format; otherwise, uses '.mjs' for ES Modules.
 * @param {object} module - The configuration object to be written to the file.
 * @returns {Promise<void>}
 */
async function createAzionConfigFile(useCommonJS, module) {
  const extension = useCommonJS ? '.cjs' : '.mjs';
  const configPath = join(process.cwd(), `azion.config${extension}`);
  const moduleExportStyle = useCommonJS ? 'module.exports =' : 'export default';

  const replacer = (key, value) => {
    if (typeof value === 'function') {
      // Converte a função para uma string, adicionando um marcador único
      return `__FUNCTION_START__${value.toString()}__FUNCTION_END__`;
    }
    return value;
  };

  let jsonString = JSON.stringify(module, replacer, 2);

  // Replace markers with a clean representation of the function
  jsonString = jsonString.replace(
    /"__FUNCTION_START__(.*?)__FUNCTION_END__"/g,
    (match, p1) => {
      return p1.replace(/\\n/g, ' ').replace(/\\'/g, "'");
    },
  );
  // Formatação da string JSON usando prettier
  const formattedContent = await prettier.format(
    `${moduleExportStyle} ${jsonString};`,
    {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      trailingComma: 'none',
    },
  );

  if (!existsSync(configPath)) {
    writeFileSync(configPath, formattedContent);
  }
}

export {
  createAzionConfigFile,
  getAzionConfigPath,
  createDotEnvFile,
  getAliasPath,
  folderExistsInProject,
  loadModule,
  isCommonJS,
};
