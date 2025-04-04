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
    const handlersPaths = normalizeEntryPointPaths(ctx.handler);
    const entriesPath = buildConfig.entry || {};

    const entriesPathMap: Record<string, string> = {};
    await Promise.all(
      handlersPaths.map(async (handlerPath, index) => {
        const tempPath = Object.values(entriesPath)[index];

        const codeRaw = buildConfig.worker
          ? await fsPromises.readFile(handlerPath, 'utf-8')
          : generateWorkerEventHandler(handlerPath);
        entriesPathMap[tempPath] = codeRaw;
      }),
    );

    return entriesPathMap;
  } catch (error: unknown) {
    throw new Error(
      `Failed to setup worker code: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
