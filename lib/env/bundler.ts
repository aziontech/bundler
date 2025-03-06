import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { Messages } from '#constants';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import {
  ModuleKind,
  ModuleResolutionKind,
  ScriptTarget,
  transpileModule,
} from 'typescript';
import prettier from 'prettier';
import { createRequire } from 'module';

/**
 * Creates or updates Bundler environment variables.
 * @async
 * @example
 * // Set multiple global environment variables
 * createBundlerEnv({ API_KEY: 'abc123', ANOTHER_KEY: 'xyz' }, 'global')
 *   .catch(error => console.error(error));
 */
export async function createBundlerEnv(
  variables: Record<string, unknown>,
  scope = 'global',
) {
  let basePath;
  switch (scope) {
    case 'global':
      basePath = globalThis.bundler.tempPath;
      break;
    case 'local':
      basePath = path.join(process.cwd());
      break;
    default:
      basePath = scope;
      break;
  }
  const vulcanEnvPath = path.join(basePath, '.azion-bundler.json');

  try {
    await fsPromises.mkdir(basePath, { recursive: true });
  } catch (error) {
    (debug as any).error(error);
    feedback.build.error(Messages.errors.folder_creation_failed(vulcanEnvPath));
    throw error;
  }

  try {
    await fsPromises.writeFile(
      vulcanEnvPath,
      JSON.stringify(variables, null, 2),
    );
  } catch (error) {
    (debug as any).error(error);
    feedback.build.error(Messages.errors.write_file_failed(vulcanEnvPath));
    throw error;
  }
}

/**
 * Reads the .vulcan file and returns an object with the variables and their values.
 * the variables and their values, or null if the file doesn't exist.
 * @example
 * // Read global environment variables
 * readBundlerEnv('global')
 *   .then(env => console.log(env))
 *   .catch(error => console.error(error));
 *
 * // Read project-level environment variables
 * readBundlerEnv('local')
 *   .then(env => console.log(env))
 *   .catch(error => console.error(error));
 */
export async function readBundlerEnv(scope = 'global') {
  let basePath;
  switch (scope) {
    case 'global':
      basePath = globalThis.bundler?.tempPath;
      break;
    case 'local':
      basePath = path.join(process.cwd());
      break;
    default:
      basePath = scope;
      break;
  }

  // Se não tiver tempPath definido, retorna objeto vazio
  if (!basePath) {
    return {};
  }

  const vulcanEnvPath = path.join(basePath, '.azion-bundler.json');

  try {
    await fsPromises.access(vulcanEnvPath);
    const fileContents = await fsPromises.readFile(vulcanEnvPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    // Se o arquivo não existir ou houver qualquer erro, retorna objeto vazio
    return {};
  }
}

/**
 * Handles dependency-related errors and provides user feedback.
 */
function handleDependencyError(error: Error, configPath: string) {
  if (error.message.includes('ERR_MODULE_NOT_FOUND')) {
    const missingPackage = error.message.match(/'([^']+)'/)?.[1];
    if (missingPackage) {
      feedback.build.error(
        `Missing dependency: ${missingPackage}. Please install it using 'npm install ${missingPackage}' or 'yarn add ${missingPackage}'.`,
      );
    } else {
      feedback.build.error(
        `A required dependency is missing. Please ensure all dependencies are installed.`,
      );
    }
    (debug as any).error(
      `Failed to load configuration from ${configPath}. ${error.message}`,
    );
  } else {
    throw error;
  }
}

/**
 * Loads the azion.config file and returns the entire configuration object.
 * @async
 */
export async function loadAzionConfig() {
  const require = createRequire(import.meta.url);
  const extensions = ['.js', '.mjs', '.cjs', '.ts'];
  const configName = 'azion.config';
  let configPath;

  // Procura pelo arquivo de configuração com as extensões suportadas
  // eslint-disable-next-line no-restricted-syntax
  for (const ext of extensions) {
    const testPath = path.join(process.cwd(), `${configName}${ext}`);
    if (fs.existsSync(testPath)) {
      configPath = testPath;
      break;
    }
  }

  if (!configPath) {
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
            module: ModuleKind.CommonJS,
            target: ScriptTarget.ES2020,
            moduleResolution: ModuleResolutionKind.Node10,
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
          if ((error as Error).message === 'ERR_REQUIRE_ESM') {
            // eslint-disable-next-line import/no-dynamic-require
            configModule = require(configPath); // Fallback para require em CommonJS
            throw error;
          }
        }
        break;
      default:
        throw new Error(`Unsupported file extension: ${extension}`);
    }

    return configModule.default || configModule;
  } catch (error) {
    if ((error as Error).message.includes('ERR_MODULE_NOT_FOUND')) {
      handleDependencyError(error as Error, configPath);
      return null;
    }
    throw error;
  }
}
/**
 * Creates an Azion configuration file with the appropriate extension if it does not exist.
 * @async
 */
export async function createAzionConfigFile(
  useCommonJS: boolean,
  module: Record<string, unknown>,
) {
  const extension = useCommonJS ? '.cjs' : '.mjs';
  const configPath = path.join(process.cwd(), `azion.config${extension}`);
  const moduleExportStyle = useCommonJS ? 'module.exports =' : 'export default';

  const replacer = (key: string, value: unknown) => {
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

export default {
  createBundlerEnv,
  readBundlerEnv,
  loadAzionConfig,
  createAzionConfigFile,
};
