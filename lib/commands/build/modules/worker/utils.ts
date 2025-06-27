import { BuildEntryPoint } from 'azion/config';
import { WORKER_MESSAGES, WORKER_TEMPLATES } from './constants';

// Re-export for backward compatibility
export { WORKER_MESSAGES };

/**
 * Detects if the source code uses Service Worker pattern (addEventListener)
 * Ignores commented lines
 */
export const isServiceWorkerPattern = (code: string): boolean => {
  const lines = code.split('\n');
  const addEventListenerRegex = /addEventListener\s*\(\s*['"`](fetch|firewall)['"`]\s*,/;

  return lines.some((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      return false;
    }
    return addEventListenerRegex.test(line);
  });
};

/**
 * Detects handlers in a module by dynamic import
 */
const detectHandlers = async (entrypointPath: string) => {
  try {
    const module = await import(entrypointPath);
    const handlers = module.default || module;

    return {
      hasFirewall: Boolean(handlers.firewall),
      hasFetch: Boolean(handlers.fetch),
    };
  } catch (error) {
    return {
      hasFirewall: false,
      hasFetch: true,
    };
  }
};

/**
 * Generates addEventListener wrapper for object exports: export default { fetch, firewall }
 *
 * Uses dynamic import to detect actual handlers, then generates optimized code
 * that only includes the event listeners for handlers that actually exist.
 */
export const generateWorkerEventHandler = async (entrypointPath: string): Promise<string> => {
  const { hasFirewall, hasFetch } = await detectHandlers(entrypointPath);

  if (!hasFirewall && !hasFetch) {
    // No handlers found - return a comment explaining this
    return `// No fetch or firewall handlers found in: ${entrypointPath}
// The original file will be used as-is in production mode.
// Consider adding: export default { fetch: (request, env, ctx) => { ... } }

console.warn('No Edge Function handlers found. File will run as-is.');`;
  }

  const parts = [WORKER_TEMPLATES.baseImport(entrypointPath)];
  if (hasFirewall) parts.push(WORKER_TEMPLATES.firewallHandler);
  if (hasFetch) parts.push(WORKER_TEMPLATES.fetchHandler);

  return parts.join('\n');
};

/**
 * Generates addEventListener wrapper for legacy pattern: export default function
 */
export const generateLegacyWrapper = (entrypointPath: string): string => {
  return `
import handler from '${entrypointPath}';

// Legacy pattern wrapper: export default function → addEventListener
addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    return await handler(event);
  })());
});
`;
};

/**
 * Detects if code uses ES Modules pattern: export default { fetch, firewall }
 */
export const isESModulesPattern = (code: string): boolean => {
  return /export\s+default\s*\{[\s\S]*fetch[\s\S]*\}/.test(code);
};

/**
 * Detects if code uses legacy pattern (any export default that is not an object)
 * Examples: export default main, export default function(){}, export default () => {}
 */
export const isLegacyPattern = (code: string): boolean => {
  // Check if there's an export default
  const hasExportDefault = /export\s+default\s+/.test(code);

  if (!hasExportDefault) {
    return false;
  }

  // If it's an ES Modules pattern, it's not legacy
  if (isESModulesPattern(code)) {
    return false;
  }

  // If it has export default but not ES Modules pattern, it's legacy
  return true;
};

/**
 * Detects handler pattern by analyzing the actual module exports
 */
export const getHandlerPatternFromModule = async (filePath: string): Promise<string> => {
  try {
    // Dynamic import to analyze the module
    const module = await import(filePath);

    // Check for Service Worker pattern (addEventListener usage)
    if (typeof module.default === 'undefined' && !module.fetch && !module.firewall) {
      // Likely has addEventListener calls
      return 'serviceWorker';
    }

    // Check for ES Modules pattern (object with fetch/firewall)
    if (
      module.default &&
      typeof module.default === 'object' &&
      (module.default.fetch || module.default.firewall)
    ) {
      return 'ESModules';
    }

    // Check for legacy pattern (any other default export)
    if (module.default) {
      return 'legacy';
    }

    return 'unsupported';
  } catch (error) {
    // Fallback to regex-based detection if import fails
    const fs = await import('fs/promises');
    const code = await fs.readFile(filePath, 'utf-8');

    if (isServiceWorkerPattern(code)) return 'serviceWorker';
    if (isESModulesPattern(code)) return 'ESModules';
    if (isLegacyPattern(code)) return 'legacy';

    return 'unsupported';
  }
};

export const normalizeEntryPointPaths = (entry: BuildEntryPoint): string[] => {
  if (typeof entry === 'string') return [entry];
  if (Array.isArray(entry)) return entry;
  return Object.values(entry);
};

export default {
  generateWorkerEventHandler,
  generateLegacyWrapper,
  normalizeEntryPointPaths,
  isServiceWorkerPattern,
  isESModulesPattern,
  isLegacyPattern,
  getHandlerPatternFromModule,
};
