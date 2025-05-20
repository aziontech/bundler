/**
 * @deprecated Legacy module that needs refactoring.
 * This module manages bundler configuration and environment setup.
 * Should be restructured to improve configuration management and type safety.
 */
import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { PresetInput } from 'azion/config';
import type { AzionConfig, BuildEntryPoint } from 'azion/config';

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

import prettier from 'prettier';
import { cosmiconfig } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';
import { DOCS_MESSAGE } from '../constants';
import type { AzionFunction } from 'azion/config';
/**
 * The store uses the local disk to save configurations,
 * allowing the development environment to run according to
 * the settings defined in the build without having to pass arguments
 */
export interface BundlerStore {
  preset?: PresetInput;
  entry?: BuildEntryPoint;
  bundler?: 'webpack' | 'esbuild';
  polyfills?: boolean;
  worker?: boolean;
  functions?: AzionFunction[];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (debug as any).error(error);
    feedback.build.error(
      `An error occurred while creating the ${bundlerSesssionStorePath} folder.${DOCS_MESSAGE}`,
    );
    throw error;
  }

  try {
    await fsPromises.writeFile(bundlerSesssionStorePath, JSON.stringify(values, null, 2));
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (debug as any).error(error);
    feedback.build.error(
      `An error occurred while writing the ${bundlerSesssionStorePath} file.${DOCS_MESSAGE}`,
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
    const fileContents = await fsPromises.readFile(bundlerStoreFilePath, 'utf8');
    return JSON.parse(fileContents);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        `Missing dependency: ${missingPackage}. Please install it using 'npm install ${missingPackage}' or 'yarn add ${missingPackage}'.${DOCS_MESSAGE}`,
      );
    } else {
      feedback.build.error(
        `A required dependency is missing. Please ensure all dependencies are installed.${DOCS_MESSAGE}`,
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (debug as any).error(`Failed to load configuration from ${configPath}. ${error.message}`);
  } else {
    throw error;
  }
}

/**
 * Loads the azion.config file and returns the entire configuration object.
 * @async
 * @param configPath - Optional specific config file path to read
 */
export async function readUserConfig(configPath?: string): Promise<AzionConfig | null> {
  const explorer = cosmiconfig('azion', {
    searchPlaces: [
      'azion.config.ts',
      'azion.config.mts',
      'azion.config.cts',
      'azion.config.js',
      'azion.config.mjs',
      'azion.config.cjs',
    ],
    loaders: {
      '.ts': TypeScriptLoader(),
      '.mts': TypeScriptLoader(),
      '.cts': TypeScriptLoader(),
    },
  });

  try {
    const result = configPath ? await explorer.load(configPath) : await explorer.search();

    if (!result) {
      return null;
    }

    return result.config as AzionConfig;
  } catch (error) {
    if ((error as Error).message.includes('ERR_MODULE_NOT_FOUND')) {
      handleDependencyError(error as Error, configPath || 'azion.config');
      return null;
    }

    if ((error as Error).message.includes('TypeScriptLoader failed to compile')) {
      const validationError = (error as Error).message
        .split('TypeScriptLoader failed to compile TypeScript:\n')[1]
        ?.trim();

      feedback.build.error(`${validationError || (error as Error).message}${DOCS_MESSAGE}`);
      process.exit(1);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (debug as any).error(error);
    feedback.build.error(
      `Failed to load configuration file. For detailed debugging information, run with DEBUG=true environment variable.${DOCS_MESSAGE}`,
    );
    process.exit(1);
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
    configComment + `${moduleExportStyle} ${JSON.stringify(config, replacer, 2)};`,
    {
      parser: 'babel',
      semi: false,
      singleQuote: true,
      trailingComma: 'none',
    },
  );

  await fsPromises.writeFile(configPath, formattedContent);
}

export default {
  writeStore,
  readStore,
  readUserConfig,
  writeUserConfig,
};
