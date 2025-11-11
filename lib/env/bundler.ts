/**
 * @deprecated Legacy module that needs refactoring.
 * This module manages bundler configuration and environment setup.
 * Should be restructured to improve configuration management and type safety.
 */
import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { convertJsonConfigToObject, type AzionConfig } from 'azion/config';

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

import prettier from 'prettier';
import { cosmiconfig } from 'cosmiconfig';
import { TypeScriptLoader } from 'cosmiconfig-typescript-loader';
import { DOCS_MESSAGE } from '../constants';
/**
 * The store uses the local disk to save configurations,
 * allowing the development environment to run according to
 * the settings defined in the build without having to pass arguments
 */
export interface BundlerStore {
  /** List of temporary files created during build process for cleanup */
  tempFiles?: string[];
  [key: string]: unknown;
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
export async function readAzionConfig(configPath?: string): Promise<AzionConfig | null> {
  const explorer = cosmiconfig('azion', {
    searchPlaces: [
      'azion.config.ts',
      'azion.config.mts',
      'azion.config.cts',
      'azion.config.js',
      'azion.config.mjs',
      'azion.config.cjs',
      'azion.config.json',
    ],
    loaders: {
      '.ts': TypeScriptLoader(),
      '.mts': TypeScriptLoader(),
      '.cts': TypeScriptLoader(),
    },
  });

  try {
    const result = configPath ? await explorer.load(configPath) : await explorer.search();

    if (!result) return null;

    const azionConfig = result.config as AzionConfig;

    const azionConfigPath = result.filepath;
    const azionConfigExt = path.extname(azionConfigPath);

    if (azionConfigExt === '.json') return convertJsonConfigToObject(JSON.stringify(azionConfig));

    return azionConfig;
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

    // Handle ERR_REQUIRE_CYCLE_MODULE error specifically
    if ((error as Error).message.includes('ERR_REQUIRE_CYCLE_MODULE')) {
      feedback.build.error(
        `Circular dependency detected while loading configuration file. This usually happens when using ES modules. Please ensure your configuration file doesn't have circular imports.${DOCS_MESSAGE}`,
      );
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
export async function writeUserConfig(config: AzionConfig, outputPath?: string): Promise<void> {
  const useCommonJS = isCommonJS();
  const extension = useCommonJS ? '.cjs' : '.mjs';

  const isTypeScript = config.build?.preset === 'typescript';
  let configExtension = isTypeScript ? '.ts' : extension;

  let configPath: string;

  if (outputPath) {
    const parsedPath = path.parse(outputPath);

    if (parsedPath.ext) {
      configPath = path.resolve(outputPath);
      configExtension = parsedPath.ext;
    } else {
      configPath = path.join(outputPath, `azion.config${configExtension}`);
    }
  } else {
    configPath = path.join(process.cwd(), `azion.config${configExtension}`);
  }

  const moduleExportStyle = isTypeScript
    ? 'export default'
    : configExtension === '.cjs'
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
 * 3. Replace the configuration with defineConfig:
 *    export default defineConfig({
 *      // Your configuration here
 *    })
 * 
 * For more configuration options, visit:
 * https://github.com/aziontech/lib/tree/main/packages/config
 */\n\n`;

  /**
   * Recursively removes undefined values from an object
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function cleanUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(cleanUndefinedValues).filter((item) => item !== undefined);
    }

    if (typeof obj === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          const cleanedValue = cleanUndefinedValues(value);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }

    return obj;
  }

  /**
   * Converts a configuration object to JavaScript code string, preserving functions
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function configToJavaScript(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent);

    if (typeof obj === 'function') {
      return obj.toString();
    }

    if (typeof obj === 'string') {
      return `'${obj.replaceAll("'", "\\'")}'`;
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj);
    }

    if (obj === null || obj === undefined) {
      return String(obj);
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      const items = obj.map((item) => configToJavaScript(item, indent + 1));
      return `[\n${spaces}  ${items.join(`,\n${spaces}  `)}\n${spaces}]`;
    }

    if (typeof obj === 'object') {
      // Filter out undefined values to keep the config clean
      const entries = Object.entries(obj).filter(([, value]) => value !== undefined);
      if (entries.length === 0) return '{}';

      const props = entries.map(([key, value]) => {
        const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`;
        return `${spaces}  ${keyStr}: ${configToJavaScript(value, indent + 1)}`;
      });

      return `{\n${props.join(',\n')}\n${spaces}}`;
    }

    return String(obj);
  }

  // Clean undefined values from config before converting to JavaScript
  const cleanedConfig = cleanUndefinedValues(config);
  const configString = configToJavaScript(cleanedConfig);

  const formattedContent = await prettier.format(
    configComment + `${moduleExportStyle} ${configString};`,
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
  readAzionConfig,
  writeUserConfig,
};
