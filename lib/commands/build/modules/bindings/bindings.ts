import { debug } from '#utils';
import fsPromises from 'fs/promises';
import path from 'path';
import { AzionConfig, AzionEdgeFunction } from 'azion/config';
import { BucketSetup } from '../storage/storage';
import { feedback } from 'azion/utils/node';
import { DIRECTORIES } from '#constants';

/**
 * Creates a storage binding template string to be injected at the top of function files
 */
const createStorageBindingTemplate = (storage: { bucket: string; prefix: string }): string => {
  return `//---
//storages:
//   - name: assets
//     bucket: ${storage.bucket}
//     prefix: ${storage.prefix}
//---
/* this temporary binding is used to inject the storage name and prefix into the function file */
globalThis.AZION_BUCKET_NAME = '${storage.bucket}';
globalThis.AZION_BUCKET_PREFIX = '${storage.prefix}';`;
};

/**
 * Checks if a file exists
 */
const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fsPromises.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Resolves the function file path
 */
const resolveFunctionPath = (functionPath: string): string => {
  return path.isAbsolute(functionPath)
    ? functionPath
    : path.resolve(process.cwd(), DIRECTORIES.OUTPUT_BASE_PATH, functionPath);
};

/**
 * Finds the corresponding storage for a binding
 */
const findStorageForBinding = (
  bucketName: string,
  bucketsSetup: BucketSetup[],
): BucketSetup | undefined => {
  return bucketsSetup.find((storage) => storage.name === bucketName);
};

/**
 * Injects bindings into a single function file
 */
const injectBindingsIntoFile = async (
  func: AzionEdgeFunction,
  bucketsSetup: BucketSetup[],
  isProduction: boolean,
): Promise<void> => {
  if (!func.path) {
    debug.warn(`Function ${func.name} does not have a defined path`);
    return;
  }

  const storageBindings = func.bindings?.storage;
  if (!storageBindings) {
    debug.info(`Function ${func.name} does not have storage bindings`);
    return;
  }

  const edgeFunctionsPath = resolveFunctionPath(
    func.path.replace(/\.js$/, isProduction ? '.js' : '.dev.js'),
  );

  if (!(await fileExists(edgeFunctionsPath))) {
    feedback.bindings.warn(`Function file not found: ${edgeFunctionsPath}.`);
    feedback.bindings.info(`Binding injection skipped for function ${func.name}`);
    return;
  }

  try {
    const entryContent = await fsPromises.readFile(edgeFunctionsPath, 'utf-8');

    // Skip if bindings are already injected
    if (entryContent.includes('//storages:') || entryContent.includes('//---')) {
      debug.info(`Function ${func.name} already has injected bindings`);
      return;
    }

    const bucketName = String(storageBindings.bucket);
    const correspondingStorage = findStorageForBinding(bucketName, bucketsSetup);

    if (!correspondingStorage) {
      debug.warn(`Storage '${bucketName}' not found for function ${func.name}`);
      return;
    }
    const bindingPrefix = storageBindings.prefix;
    const prefix = bindingPrefix || correspondingStorage.prefix;

    if (!bindingPrefix) {
      feedback.postbuild.info(
        `No prefix provided for binding in function '${func.name}', using storage prefix: ${prefix}`,
      );
    }
    if (bindingPrefix) {
      feedback.postbuild.info(
        `Using provided prefix for binding in function '${func.name}': ${prefix}`,
      );
    }

    const bindingTemplate = createStorageBindingTemplate({
      bucket: bucketName,
      prefix,
    });

    debug.info(`Generated binding template for ${func.name}: ${bindingTemplate}`);

    const contentWithBindings = `${bindingTemplate}\n${entryContent}`;

    await fsPromises.writeFile(edgeFunctionsPath, contentWithBindings);
    debug.info(`Bindings injected into ${edgeFunctionsPath} for function ${func.name}`);
  } catch (error) {
    debug.error(`Failed to process bindings for function ${func.name}:`, error);
    throw error;
  }
};

/**
 * Main function that sets up bindings for all functions in the config
 */
export const setupBindings = async ({
  config,
  storageSetup,
  isProduction,
}: {
  config: AzionConfig;
  storageSetup: BucketSetup[];
  isProduction: boolean;
}): Promise<void> => {
  try {
    const functions = config.edgeFunctions || [];

    if (functions.length === 0) {
      debug.info('No functions found to inject bindings');
      return;
    }

    debug.info('Injecting bindings into functions...');
    await Promise.all(
      functions.map((func) => injectBindingsIntoFile(func, storageSetup, isProduction)),
    );
  } catch (error) {
    debug.error('Failed to execute bindings setup:', error);
    return Promise.reject(error);
  }
};
