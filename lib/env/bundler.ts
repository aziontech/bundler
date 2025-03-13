/**
 * @deprecated Legacy module that needs refactoring.
 * This module manages bundler configuration and environment setup.
 * Should be restructured to improve configuration management and type safety.
 */
import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { PresetInput } from 'azion/config';

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
import { AzionConfig } from 'azion/config';

export interface BundlerStore {
  preset?: PresetInput;
  entry?: string;
  bundler?: 'webpack' | 'esbuild';
  polyfills?: boolean;
  worker?: boolean;
}

/**
 * Creates or updates Bundler environment variables.
 * @async
 * @example
 * // Set multiple global environment variables
 * writeStore({ API_KEY: 'abc123', ANOTHER_KEY: 'xyz' }, 'global')
 *   .catch(error => console.error(error));
 */
export async function writeStore(values: BundlerStore, scope = 'global') {
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
  const bundlerSesssionStorePath = path.join(basePath, '.azion-bundler.json');

  try {
    await fsPromises.mkdir(basePath, { recursive: true });
  } catch (error) {
    (debug as any).error(error);
    feedback.build.error(
      `An error occurred while creating the ${bundlerSesssionStorePath} folder.`,
    );
    throw error;
  }

  try {
    await fsPromises.writeFile(
      bundlerSesssionStorePath,
      JSON.stringify(values, null, 2),
    );
  } catch (error) {
    (debug as any).error(error);
    feedback.build.error(
      `An error occurred while writing the ${bundlerSesssionStorePath} file.`,
    );
    throw error;
  }
}

/**
 * Reads the .azion-bundler.json file and returns the stored configuration.
 * Returns an empty object if the file doesn't exist.
 */
export async function readStore(
  scope: 'global' | 'local' | string = 'global',
): Promise<BundlerStore> {
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

  if (!basePath) return {};

  const bundlerStoreFilePath = path.join(basePath, '.azion-bundler.json');

  try {
    await fsPromises.access(bundlerStoreFilePath);
    const fileContents = await fsPromises.readFile(
      bundlerStoreFilePath,
      'utf8',
    );
    return JSON.parse(fileContents);
  } catch (error) {
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
export async function readUserConfig() {
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
 * Checks if the project is using CommonJS based on package.json
 * If there's no package.json or no 'type' field, assumes CommonJS
 */
function isCommonJS(): boolean {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.type !== 'module';
  }

  return true;
}

/**
 * Creates an Azion configuration file with the appropriate extension.
 * Determines module type (CommonJS/ESM) from package.json
 * @async
 */
export async function writeUserConfig(config: AzionConfig): Promise<void> {
  const useCommonJS = isCommonJS();
  const extension = useCommonJS ? '.cjs' : '.mjs';

  const isTypeScript = config.build?.preset === 'typescript';
  const configExtension = isTypeScript ? '.ts' : extension;
  const configPath = path.join(process.cwd(), `azion.config${configExtension}`);

  const moduleExportStyle = isTypeScript
    ? 'export default'
    : useCommonJS
      ? 'module.exports ='
      : 'export default';
  const configComment = `/**
 * This file was automatically generated based on your preset configuration.
 * 
 * For better type checking and IntelliSense:
 * 1. Install azion as dev dependency:
 *    npm install -D azion
 * 
 * 2. Use defineConfig:
 *    import { defineConfig } from 'azion'
 * 
 * For more configuration options, visit:
 * https://github.com/aziontech/azion
 */\n\n`;

  const replacer = (key: string, value: unknown) => {
    if (typeof value === 'function') {
      return `__FUNCTION_START__${value.toString()}__FUNCTION_END__`;
    }
    return value;
  };

  const formattedContent = await prettier.format(
    configComment +
      `${moduleExportStyle} ${JSON.stringify(config, replacer, 2)};`,
    {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      trailingComma: 'none',
    },
  );

  if (!fs.existsSync(configPath)) {
    await fsPromises.writeFile(configPath, formattedContent);
  }
}

export default {
  writeStore,
  readStore,
  readUserConfig,
  writeUserConfig,
};
