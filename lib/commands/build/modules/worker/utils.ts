import { BuildEntryPoint } from 'azion/config';

export const generateWorkerEventHandler = (entrypointPath: string): string => {
  return `
import entrypoint from '${entrypointPath}';

// Handle the case where import returns a function directly
const module = typeof entrypoint === 'function' 
  ? { default: entrypoint } 
  : entrypoint;

// Check standard handlers first
const hasFirewallHandler = module.firewall || (module.default && module.default.firewall);

// Detect if the module exports a function directly (legacy)
const isLegacyDefaultFunction = typeof module.default === 'function';

let eventType = 'fetch';
let handler;

if (hasFirewallHandler) {
  eventType = 'firewall';
  handler = module.firewall || module.default.firewall;
} else if (isLegacyDefaultFunction) {
  // Legacy case: function exported directly as default
  handler = module.default;
  } else {
  // Normal case: look for fetch handler
  handler = module.fetch || (module.default && module.default.fetch);
}

if (!handler) {
  throw new Error("Handler not found in module");
}

addEventListener(eventType, (event) => {
  if (eventType === 'fetch' && !hasFirewallHandler) {
    event.respondWith((async function() {
      try {
        return handler(event);
      } catch (error) {
        return new Response(\`Error: \${error.message}\`, { status: 500 });
      }
    })());
  } 
  else {
    (async function() {
      try {
        return handler(event);
      } catch (error) {
        return new Response(\`Error: \${error.message}\`, { status: 500 });
      }
    })();
  }
});
`;
};

export const normalizeEntryPointPaths = (entry: BuildEntryPoint): string[] => {
  if (typeof entry === 'string') return [entry];
  if (Array.isArray(entry)) return entry;
  return Object.values(entry);
};

export default { generateWorkerEventHandler, normalizeEntryPointPaths };
