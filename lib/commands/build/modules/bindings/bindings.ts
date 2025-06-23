// import { debug } from '#utils';
// import fsPromises from 'fs/promises';
// import path from 'path';
// import { AzionConfig, AzionEdgeFunction } from 'azion/config';

// /**
//  * Creates a storage binding template string to be injected at the top of function files
//  */
// const createStorageBindingTemplate = (storage: { bucket: string; prefix?: string }): string => {
//   return `//---
// //storages:
// //   - name: assets
// //     bucket: ${storage.bucket}${storage.prefix ? `\n//     prefix: ${storage.prefix}` : ''}
// //---`;
// };

// /**
//  * Resolves a file path to its absolute path
//  */
// const resolveFilePath = (filePath: string): string => {
//   return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
// };

// /**
//  * Checks if a file exists
//  */
// const fileExists = async (filePath: string): Promise<boolean> => {
//   try {
//     await fsPromises.access(filePath);
//     return true;
//   } catch {
//     return false;
//   }
// };

// /**
//  * Injects bindings into a single function file
//  */
// const injectBindingsIntoFile = async (func: AzionEdgeFunction): Promise<void> => {
//   if (!func.path) {
//     debug.warn(`Function ${func.name} does not have a defined path`);
//     return;
//   }

//   const storageBindings = func.bindings?.storage;
//   if (!storageBindings) {
//     debug.info(`Function ${func.name} does not have storage bindings`);
//     return;
//   }

//   const absolutePath = resolveFilePath(func.path);

//   if (!(await fileExists(absolutePath))) {
//     debug.error(`Function file not found: ${absolutePath}`);
//     return;
//   }

//   try {
//     const entryContent = await fsPromises.readFile(absolutePath, 'utf-8');

//     // Skip if bindings are already injected
//     if (entryContent.includes('//storages:')) {
//       debug.info(`Function ${func.name} already has injected bindings`);
//       return;
//     }

//     const bindingTemplate = createStorageBindingTemplate(storageBindings);
//     const contentWithBindings = `${bindingTemplate}\n${entryContent}`;

//     await fsPromises.writeFile(absolutePath, contentWithBindings);
//     debug.info(`Bindings injected into ${absolutePath} for function ${func.name}`);
//   } catch (error) {
//     debug.error(`Failed to process bindings for function ${func.name}:`, error);
//     throw error;
//   }
// };

// /**
//  * Main function that sets up bindings for all functions in the config
//  */
// export const setupBindings = async ({ config }: { config: AzionConfig }): Promise<void> => {
//   try {
//     const functions = config.edgeFunctions || [];

//     if (functions.length === 0) {
//       debug.info('No functions found to inject bindings');
//       return;
//     }

//     debug.info('Injecting bindings into functions...');
//     await Promise.all(functions.map(injectBindingsIntoFile));
//   } catch (error) {
//     debug.error('Failed to execute bindings setup:', error);
//     return Promise.reject(error);
//   }
// };
