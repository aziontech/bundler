import { feedback, debug } from '#utils';
import { Messages } from '#constants';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { transpileModule } from 'typescript';
import prettier from 'prettier';
import { createRequire } from 'module';

/**
 * Creates or updates Vulcan environment variables.
 * @async
 * @param {object} variables - An object containing the environment variables to set.
 * @param {string} [scope='local'] - Can be 'global', 'local', or a custom path.
 * @throws {Error} Throws an error if the environment file cannot be read or written.
 * @example
 * // Set multiple global environment variables
 * createVulcanEnv({ API_KEY: 'abc123', ANOTHER_KEY: 'xyz' }, 'global')
 *   .catch(error => console.error(error));
 */
async function createVulcanEnv(variables, scope = 'global') {
  let basePath;
  switch (scope) {
    case 'global':
      basePath = globalThis.vulcan.tempPath;
      break;
    case 'local':
      basePath = path.join(process.cwd());
      break;
    default:
      basePath = scope;
      break;
  }
  const vulcanEnvPath = path.join(basePath, '.azion-bundler');

  try {
    await fsPromises.mkdir(basePath, { recursive: true });
  } catch (error) {
    debug.error(error);
    feedback.error(Messages.errors.folder_creation_failed(vulcanEnvPath));
    throw error;
  }

  let envData = '';
  try {
    envData = await fsPromises.readFile(vulcanEnvPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      debug.error(error);
      feedback.error(Messages.errors.file_doesnt_exist(vulcanEnvPath));
      throw error;
    }
  }

  Object.entries(variables).forEach(([key, value]) => {
    const variableLine = `${key}=${value}`;
    const variableRegex = new RegExp(`${key}=.+`);

    if (envData.match(variableRegex)) {
      envData = envData.replace(variableRegex, variableLine);
    } else {
      envData += `${variableLine}\n`;
    }
  });

  try {
    await fsPromises.writeFile(vulcanEnvPath, envData);
  } catch (error) {
    debug.error(error);
    feedback.error(Messages.errors.write_file_failed(vulcanEnvPath));
    throw error;
  }
}

/**
 * Reads the .vulcan file and returns an object with the variables and their values.
 * @param {string} [scope='local'] - Can be 'global', 'local', or a custom path.
 * @returns {Promise<object|null>} A promise that resolves to an object with
 * the variables and their values, or null if the file doesn't exist.
 * @throws {Error} Throws an error if the environment file cannot be read.
 * @example
 * // Read global environment variables
 * readVulcanEnv('global')
 *   .then(env => console.log(env))
 *   .catch(error => console.error(error));
 *
 * // Read project-level environment variables
 * readVulcanEnv('local')
 *   .then(env => console.log(env))
 *   .catch(error => console.error(error));
 */
async function readVulcanEnv(scope = 'local') {
  let basePath;
  switch (scope) {
    case 'global':
      basePath = globalThis.vulcan.tempPath;
      break;
    case 'local':
      basePath = path.join(process.cwd());
      break;
    default:
      basePath = scope;
      break;
  }
  const vulcanEnvPath = path.join(basePath, '.azion-bundler');

  try {
    await fsPromises.access(vulcanEnvPath);
    const fileContents = await fsPromises.readFile(vulcanEnvPath, 'utf8');

    const variables = {};
    const variableRegex = /^([^=]+)=(.*)$/gm;
    let match = variableRegex.exec(fileContents);
    while (match !== null) {
      const key = match[1].trim();
      const value = match[2].trim();
      variables[key] = value;
      match = variableRegex.exec(fileContents);
    }

    return variables;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    debug.error(error);
    throw error;
  }
}

/**
 * Handles dependency-related errors and provides user feedback.
 * @param {Error} error - The error object caught during module loading.
 * @param {string} configPath - The path to the configuration file.
 * @throws {Error} Rethrows the original error if it's not a dependency issue.
 */
function handleDependencyError(error, configPath) {
  if (error.code === 'ERR_MODULE_NOT_FOUND') {
    const missingPackage = error.message.match(/'([^']+)'/)?.[1];
    if (missingPackage) {
      feedback.error(
        `Missing dependency: ${missingPackage}. Please install it using 'npm install ${missingPackage}' or 'yarn add ${missingPackage}'.`,
      );
    } else {
      feedback.error(
        `A required dependency is missing. Please ensure all dependencies are installed.`,
      );
    }
    debug.error(
      `Failed to load configuration from ${configPath}. ${error.message}`,
    );
  } else {
    throw error;
  }
}

/**
 * Loads the azion.config file and returns the entire configuration object.
 * @async
 * @param {string} [configPath] - Optional path to the config file. If not provided, it will search in the current working directory.
 * @returns {Promise<object|null>} A promise that resolves to the entire configuration from azion.config, or null if not found.
 * @throws {Error} Throws an error if there are issues reading or parsing the configuration file.
 */
async function loadAzionConfig(configPath) {
  const require = createRequire(import.meta.url);
  const extensions = ['.js', '.mjs', '.cjs', '.ts'];
  const configName = 'azion.config';

  if (!configPath) {
    // eslint-disable-next-line no-restricted-syntax
    for (const ext of extensions) {
      const testPath = path.join(process.cwd(), `${configName}${ext}`);
      if (fs.existsSync(testPath)) {
        // eslint-disable-next-line no-param-reassign
        configPath = testPath;
        break;
      }
    }
  }

  if (!configPath || !fs.existsSync(configPath)) {
    return null;
  }

  const extension = path.extname(configPath);
  let configModule;

  try {
    switch (extension) {
      case '.ts':
        // eslint-disable-next-line no-case-declarations
        const tsContent = await fsPromises.readFile(configPath, 'utf-8');
        // eslint-disable-next-line no-case-declarations
        const jsContent = transpileModule(tsContent, {
          compilerOptions: {
            module: 'commonjs',
            target: 'es2020',
            moduleResolution: 'node',
          },
        }).outputText;

        // eslint-disable-next-line no-case-declarations
        const tempJsPath = configPath.replace('.ts', '.temp.js');
        await fsPromises.writeFile(tempJsPath, jsContent);

        try {
          // eslint-disable-next-line import/no-dynamic-require
          configModule = require(tempJsPath);
        } finally {
          await fsPromises.unlink(tempJsPath);
        }
        break;
      case '.mjs':
        configModule = await import(configPath);
        break;
      case '.cjs':
      case '.js':
        try {
          configModule = await import(configPath);
        } catch (error) {
          if (error.code === 'ERR_REQUIRE_ESM') {
            // eslint-disable-next-line import/no-dynamic-require
            configModule = require(configPath); // Fallback to require for CommonJS
          } else {
            throw error; // Re-throw other errors
          }
        }
        break;
      default:
        throw new Error(`Unsupported file extension: ${extension}`);
    }

    return configModule.default || configModule;
  } catch (error) {
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      handleDependencyError(error, configPath);
      return null;
    }
    throw error;
  }
}

/**
 * Creates an Azion configuration file with the appropriate extension if it does not exist.
 * @async
 * @param {boolean} useCommonJS - If true, uses the '.cjs' extension and CommonJS format; otherwise, uses '.mjs' for ES Modules.
 * @param {object} module - The configuration object to be written to the file.
 * @returns {Promise<void>}
 */
async function createAzionConfigFile(useCommonJS, module) {
  const extension = useCommonJS ? '.cjs' : '.mjs';
  const configPath = path.join(process.cwd(), `azion.config${extension}`);
  const moduleExportStyle = useCommonJS ? 'module.exports =' : 'export default';

  const replacer = (key, value) => {
    if (typeof value === 'function') {
      return `__FUNCTION_START__${value.toString()}__FUNCTION_END__`;
    }
    return value;
  };

  let jsonString = JSON.stringify(module, replacer, 2);

  jsonString = jsonString.replace(
    /"__FUNCTION_START__(.*?)__FUNCTION_END__"/g,
    (match, p1) => {
      return p1.replace(/\\n/g, ' ').replace(/\\'/g, "'");
    },
  );

  const formattedContent = await prettier.format(
    `${moduleExportStyle} ${jsonString};`,
    {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      trailingComma: 'none',
    },
  );

  const finalContent = `${formattedContent}`;

  if (!fs.existsSync(configPath)) {
    await fsPromises.writeFile(configPath, finalContent);
  }
}

/**
 * Gets the path of the existing Azion configuration file in the current working directory.
 * @async
 * @returns {Promise<string|null>} The path of the Azion configuration file if it exists, otherwise null.
 */
async function getAzionConfigPath() {
  const extensions = ['.js', '.mjs', '.cjs', '.ts'];
  const configName = 'azion.config';

  // eslint-disable-next-line no-restricted-syntax
  for (const ext of extensions) {
    const configPath = path.join(process.cwd(), `${configName}${ext}`);
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

export default {
  createVulcanEnv,
  readVulcanEnv,
  loadAzionConfig,
  createAzionConfigFile,
  getAzionConfigPath,
};
