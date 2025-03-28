import fsPromises from 'fs/promises';
import { BuildConfiguration, BuildContext } from 'azion/config';
import { normalizeEntryPointPaths, generateWorkerEventHandler } from './utils';

/**
 * Processes handler files and prepares them for bundling
 *
 * @param buildConfig - Build configuration object
 * @param ctx - Build context with entry points
 * @returns Object mapping bundler paths to processed contents
 *
 * @example
 * // Returns an object like:
 * {
 *   "/tmp/bundler/handler1.js": "addEventListener('fetch', (event) => {...})",
 * }
 */
export const setupWorkerCode = async (
  buildConfig: BuildConfiguration,
  ctx: BuildContext,
): Promise<Record<string, string>> => {
  try {
    /** Paths to the original handler files that contain the worker logic */
    const handlerPaths = normalizeEntryPointPaths(ctx.entrypoint);
    /** Paths where bundler entries should be written */
    const bundlerEntryPaths = normalizeEntryPointPaths(buildConfig.entry);

    const convertEsmToWorkerSignature = async (
      handlers: string[],
    ): Promise<string[]> => {
      if (buildConfig.worker) {
        return Promise.all(
          handlers.map((handler) => fsPromises.readFile(handler, 'utf-8')),
        );
      }

      return handlers.map((handler) => generateWorkerEventHandler(handler));
    };

    /** Array of processed contents ready to be written to bundler entry files */
    const workers = await convertEsmToWorkerSignature(handlerPaths);

    /** Object mapping each bundler path to its processed content */
    return bundlerEntryPaths.reduce(
      (acc, path, index) => ({
        ...acc,
        [path]: workers[index],
      }),
      {},
    );
  } catch (error: unknown) {
    throw new Error(
      `Failed to setup worker code: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
