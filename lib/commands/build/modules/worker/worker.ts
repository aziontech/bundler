import fsPromises from 'fs/promises';
import type { BuildConfiguration, BuildContext } from 'azion/config';
import { generateWorkerEventHandler, normalizeEntryPointPaths } from './utils';

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
    const tempPaths = Object.values(buildConfig.entry);

    const handlersPaths = normalizeEntryPointPaths(ctx.handler);

    const workersEntries: Record<string, string> = {};

    for (let i = 0; i < handlersPaths.length; i++) {
      const handlerPath = handlersPaths[i];
      const tempPath = tempPaths[i];

      const codeRaw = buildConfig.worker
        ? await fsPromises.readFile(handlerPath, 'utf-8')
        : generateWorkerEventHandler(handlerPath);

      workersEntries[tempPath] = codeRaw;
    }

    return workersEntries;
  } catch (error: unknown) {
    throw new Error(
      `Failed to setup worker code: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
