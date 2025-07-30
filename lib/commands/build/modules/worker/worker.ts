import fsPromises from 'fs/promises';
import type { BuildConfiguration, BuildContext } from 'azion/config';
import {
  generateWorkerEventHandler,
  generateLegacyWrapper,
  normalizeEntryPointPaths,
  isServiceWorkerPattern,
  isESModulesPattern,
  isLegacyPattern,
  getHandlerPatternFromModule,
} from './utils';
import { feedback } from 'azion/utils/node';
import { WORKER_MESSAGES } from './constants';

/**
 * Gets the handler pattern used in the code (fallback for when module import fails)
 */
const getHandlerPatternFromCode = (code: string) => {
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
const processWorkerCode = async (
  originalCode: string,
  handlerPath: string,
  isProduction: boolean,
): Promise<string> => {
  // Try module-based detection first, fallback to regex
  let pattern: string;
  try {
    pattern = await getHandlerPatternFromModule(handlerPath);
  } catch {
    pattern = getHandlerPatternFromCode(originalCode);
  }

  switch (pattern) {
    case 'serviceWorker':
      return originalCode;

    case 'ESModules':
      return await generateWorkerEventHandler(handlerPath, isProduction);

    case 'legacy':
      feedback.build.warn(WORKER_MESSAGES.LEGACY_DEPRECATION);
      return generateLegacyWrapper(handlerPath);

    case 'unsupported':
    default:
      feedback.build.warn(WORKER_MESSAGES.UNSUPPORTED_PATTERN_DETECTED);
      feedback.build.info(WORKER_MESSAGES.UNSUPPORTED_PATTERN_SUGGESTIONS);
      return originalCode;
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

        const processedCode = await processWorkerCode(originalCode, handlerPath, ctx.production);

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
