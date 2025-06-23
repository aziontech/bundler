import { BuildEntryPoint } from 'azion/config';

// Constants
export const WORKER_MESSAGES = {
  LEGACY_DEPRECATION:
    'DEPRECATED: Migrate to → export default { fetch: (request, env, ctx) => {...} }',
  UNSUPPORTED_PATTERN: `Unsupported export pattern.

Supported patterns:

- Service Worker Pattern:
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

- ES Modules Pattern:
export default {
  fetch: (request, env, ctx) => {
    return new Response('Hello World');
  },
  firewall: (request, env, ctx) => {
    return new Response('Hello World');
  }
};`,
};

/**
 * Detects if the source code uses Service Worker pattern (addEventListener)
 * Ignores commented lines
 */
export const isServiceWorkerPattern = (code: string): boolean => {
  const lines = code.split('\n');
  const addEventListenerRegex = /addEventListener\s*\(\s*['"`](fetch|firewall)['"`]\s*,/;

  return lines.some((line) => {
    const trimmedLine = line.trim();
    // Ignore commented lines
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
      return false;
    }
    return addEventListenerRegex.test(line);
  });
};

/**
 * Generates addEventListener wrapper for object exports: export default { fetch, firewall }
 */
export const generateWorkerEventHandler = (entrypointPath: string): string => {
  return `
import module from '${entrypointPath}';

// Object export pattern: export default { fetch, firewall }
const handlers = module;
const firewallHandler = handlers.firewall;
const fetchHandler = handlers.fetch;

if (firewallHandler) {
  addEventListener('firewall', (event) => {
    (async () => {
      const request = event.request;
      const env = {};
      const ctx = { waitUntil: event.waitUntil?.bind(event) };
      
      await firewallHandler(request, env, ctx);
    })().catch(console.error);
  });
}

if (fetchHandler) {
  addEventListener('fetch', (event) => {
    event.respondWith((async () => {
      const request = event.request;
      const env = {};
      const ctx = { waitUntil: event.waitUntil?.bind(event) };
      
      return await fetchHandler(request, env, ctx);
    })());
  });
} else if (!firewallHandler) {
  throw new Error("No fetch handler found in default export object.");
}
`;
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
};
