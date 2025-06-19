import { describe, it, expect } from '@jest/globals';
import {
  generateWorkerEventHandler,
  generateLegacyWrapper,
  normalizeEntryPointPaths,
  detectAddEventListenerUsage,
} from './utils';

describe('detectAddEventListenerUsage', () => {
  it('should detect addEventListener with fetch event', () => {
    const code = `addEventListener('fetch', (event) => { /* handler */ });`;
    expect(detectAddEventListenerUsage(code)).toBe(true);
  });

  it('should detect addEventListener with firewall event', () => {
    const code = `addEventListener("firewall", function(event) { /* handler */ });`;
    expect(detectAddEventListenerUsage(code)).toBe(true);
  });

  it('should not detect addEventListener with other events', () => {
    const code = `addEventListener('click', (event) => { /* handler */ });`;
    expect(detectAddEventListenerUsage(code)).toBe(false);
  });

  it('should not detect addEventListener in comments', () => {
    const code = `// addEventListener('fetch', (event) => {});`;
    expect(detectAddEventListenerUsage(code)).toBe(false);
  });
});

describe('detectObjectExport', () => {
  it('should detect object export pattern', () => {
    const code1 = `export default { fetch: () => {}, firewall: () => {} }`;
    const code2 = `export default {
      fetch: (request, env, ctx) => new Response('ok'),
      firewall: (request, env, ctx) => null
    }`;
    const code3 = `export default { fetch(request, env, ctx) { return new Response('ok'); } }`;

    const hasObjectExport = (code: string) =>
      /export\s+default\s*\{[\s\S]*fetch[\s\S]*\}/.test(code);

    expect(hasObjectExport(code1)).toBe(true);
    expect(hasObjectExport(code2)).toBe(true);
    expect(hasObjectExport(code3)).toBe(true);
  });

  it('should not detect other export patterns', () => {
    const code1 = `export function fetch() {}`;
    const code2 = `export default function() {}`;
    const code3 = `addEventListener('fetch', () => {})`;

    const hasObjectExport = (code: string) =>
      /export\s+default\s*\{[\s\S]*fetch[\s\S]*\}/.test(code);

    expect(hasObjectExport(code1)).toBe(false);
    expect(hasObjectExport(code2)).toBe(false);
    expect(hasObjectExport(code3)).toBe(false);
  });
});

describe('generateWorkerEventHandler', () => {
  it('should generate addEventListener wrapper for object exports', () => {
    const entrypoint = 'src/index.js';
    const result = generateWorkerEventHandler(entrypoint);

    expect(result).toContain(`import module from '${entrypoint}'`);
    expect(result).toContain('Object export pattern');
    expect(result).toContain('const handlers = module');
  });

  it('should handle fetch handler', () => {
    const result = generateWorkerEventHandler('app.js');

    expect(result).toContain('const fetchHandler = handlers.fetch');
    expect(result).toContain("addEventListener('fetch', (event) => {");
    expect(result).toContain('event.respondWith');
  });

  it('should handle firewall handler', () => {
    const result = generateWorkerEventHandler('app.js');

    expect(result).toContain('const firewallHandler = handlers.firewall');
    expect(result).toContain("addEventListener('firewall', (event) => {");
  });

  it('should create proper ESM signature', () => {
    const result = generateWorkerEventHandler('app.js');

    expect(result).toContain('const request = event.request');
    expect(result).toContain('const env = {}');
    expect(result).toContain('const ctx = { waitUntil: event.waitUntil?.bind(event) }');
  });

  it('should include error handling for missing fetch handler', () => {
    const result = generateWorkerEventHandler('app.js');

    expect(result).toContain('No fetch handler found in default export object');
  });
});

describe('generateLegacyWrapper', () => {
  it('should generate addEventListener wrapper for legacy function', () => {
    const entrypoint = 'src/legacy.js';
    const result = generateLegacyWrapper(entrypoint);

    expect(result).toContain(`import handler from '${entrypoint}'`);
    expect(result).toContain('Legacy pattern wrapper');
    expect(result).toContain("addEventListener('fetch', (event) => {");
  });

  it('should call the legacy handler with event', () => {
    const result = generateLegacyWrapper('app.js');

    expect(result).toContain('return await handler(event)');
    expect(result).toContain('event.respondWith');
  });

  it('should include proper async handling', () => {
    const result = generateLegacyWrapper('app.js');

    expect(result).toContain('event.respondWith((async () => {');
    expect(result).toContain('})());');
  });
});

describe('detectLegacyPattern', () => {
  it('should detect legacy default function pattern', () => {
    const code1 = `export default function handler(event) { return new Response('ok'); }`;
    const code2 = `export default async function(event) { return new Response('ok'); }`;
    const code3 = `export default function(event, ctx) { return new Response('ok'); }`;

    const hasLegacyPattern = (code: string) =>
      /export\s+default\s+(?:async\s+)?function\s*\([^)]*event[^)]*\)/.test(code);

    expect(hasLegacyPattern(code1)).toBe(true);
    expect(hasLegacyPattern(code2)).toBe(true);
    expect(hasLegacyPattern(code3)).toBe(true);
  });

  it('should not detect other function patterns', () => {
    const code1 = `export default function handler(request, env, ctx) {}`;
    const code2 = `export function handler(event) {}`;
    const code3 = `export default { fetch: (event) => {} }`;

    const hasLegacyPattern = (code: string) =>
      /export\s+default\s+(?:async\s+)?function\s*\([^)]*event[^)]*\)/.test(code);

    expect(hasLegacyPattern(code1)).toBe(false);
    expect(hasLegacyPattern(code2)).toBe(false);
    expect(hasLegacyPattern(code3)).toBe(false);
  });
});

describe('normalizeEntryPointPaths', () => {
  it('should normalize string entry to array', () => {
    const result = normalizeEntryPointPaths('src/index.js');
    expect(result).toEqual(['src/index.js']);
  });

  it('should return array as-is', () => {
    const input = ['src/index.js', 'src/api.js'];
    const result = normalizeEntryPointPaths(input);
    expect(result).toEqual(input);
  });

  it('should extract values from object', () => {
    const input = { main: 'src/index.js', api: 'src/api.js' };
    const result = normalizeEntryPointPaths(input);
    expect(result).toEqual(['src/index.js', 'src/api.js']);
  });
});
