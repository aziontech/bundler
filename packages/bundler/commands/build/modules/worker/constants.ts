// Error messages for worker module
export const WORKER_MESSAGES = {
  LEGACY_DEPRECATION:
    'DEPRECATED: Migrate handler to → export default { fetch: (request, env, ctx) => {...} }',
  UNSUPPORTED_PATTERN_DETECTED:
    'Unsupported handler pattern detected. Generating Service Worker wrapper as fallback.',
  UNSUPPORTED_PATTERN_SUGGESTIONS: `Consider updating your handler to use ES Modules pattern.`,
};

// Templates for code generation
const contextSetup = `
const request = event.request;
const env = {};
const ctx = { waitUntil: event.waitUntil?.bind(event) };`;

export const WORKER_TEMPLATES = {
  baseImport: (entrypointPath: string) => `
import module from '${entrypointPath}';

// Object export pattern: export default { fetch, firewall }
const handlers = module.default || module;`,

  contextSetup,

  firewallHandler: `
const firewallHandler = handlers.firewall;
addEventListener('firewall', (event) => {
  (async () => {${contextSetup}
    
    await firewallHandler(request, env, ctx);
  })().catch(console.error);
});`,

  fetchHandler: (isProduction: boolean) => `
${
  isProduction
    ? 'export default module;'
    : `
    const fetchHandler = handlers.fetch;
  addEventListener('fetch', (event) => {${contextSetup}
  event.respondWith((async () => {
    return fetchHandler(request, env, ctx);
  })());
});`
}
`,

  fallbackHandler: (entrypointPath: string) => {
    const baseImport = `
import module from '${entrypointPath}';

// Object export pattern: export default { fetch, firewall }
const handlers = module.default || module;`;

    return `${baseImport}
const fetchHandler = handlers.fetch;

if (fetchHandler) {
  addEventListener('fetch', (event) => {${contextSetup}
    
    event.respondWith((async () => {
      return fetchHandler(request, env, ctx);
    })());
  });
} else {
  throw new Error("No fetch handler found in default export object.");
}`;
  },
};
