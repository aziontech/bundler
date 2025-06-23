import fsPromises from 'fs/promises';
import type { BuildConfiguration, BuildContext } from 'azion/config';
import {
  generateWorkerEventHandler,
  normalizeEntryPointPaths,
  isServiceWorkerPattern,
  isESModulesPattern,
  isLegacyPattern,
  WORKER_MESSAGES,
} from './utils';
import { feedback } from 'azion/utils/node';

/**
 * Gets the handler pattern used in the code
 */
const getHandlerPattern = (code: string) => {
  if (isServiceWorkerPattern(code)) {
    return 'serviceWorker';
  }

  if (isESModulesPattern(code)) {
    return 'ESModules';
  }

  if (isLegacyPattern(code)) {
    return 'legacy';
  }

  return 'unsupported';
};

/**
 * Processes worker code based on pattern and environment
 */
const processWorkerCode = (
  originalCode: string,
  handlerPath: string,
  isProduction: boolean,
): string => {
  const pattern = getHandlerPattern(originalCode);

  switch (pattern) {
    case 'serviceWorker':
      return originalCode; // Always use original

    case 'ESModules':
      return isProduction
        ? originalCode // Production: native ESM support
        : generateWorkerEventHandler(handlerPath); // Development: addEventListener wrapper

    case 'legacy':
      feedback.build.warn(WORKER_MESSAGES.LEGACY_DEPRECATION);
      return originalCode;

    case 'unsupported':
    default:
      throw new Error(WORKER_MESSAGES.UNSUPPORTED_PATTERN);
  }
};

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

    const entries = await Promise.all(
      handlersPaths.map(async (handlerPath, index) => {
        const tempPath = Object.values(entriesPath)[index];
        const originalCode = await fsPromises.readFile(handlerPath, 'utf-8');

        const processedCode = processWorkerCode(originalCode, handlerPath, ctx.production);

        return [tempPath, processedCode] as const;
      }),
    );

    return Object.fromEntries(entries);
  } catch (error: unknown) {
    throw new Error(
      `Failed to setup worker code: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
