import { BuildEntryPoint } from 'azion/config';

/**
 * Detects if the source code already uses addEventListener pattern
 */
export const detectAddEventListenerUsage = (code: string): boolean => {
  const addEventListenerRegex = /addEventListener\s*\(\s*['"`](fetch|firewall)['"`]\s*,/;
  return addEventListenerRegex.test(code);
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
 * Generates addEventListener wrapper for legacy pattern: export default function(event)
 */
export const generateLegacyWrapper = (entrypointPath: string): string => {
  return `
import handler from '${entrypointPath}';

// Legacy pattern wrapper: export default function(event) → addEventListener
addEventListener('fetch', (event) => {
  event.respondWith((async () => {
    return await handler(event);
  })());
});
`;
};

export const normalizeEntryPointPaths = (entry: BuildEntryPoint): string[] => {
  if (typeof entry === 'string') return [entry];
  if (Array.isArray(entry)) return entry;
  return Object.values(entry);
};

export default {
  generateWorkerEventHandler,
  normalizeEntryPointPaths,
  detectAddEventListenerUsage,
};
