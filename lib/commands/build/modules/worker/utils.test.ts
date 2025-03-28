import { describe, it, expect } from '@jest/globals';
import { generateWorkerEventHandler, normalizeEntryPointPaths } from './utils';

describe('generateWorkerEventHandler', () => {
  it('should generate handler code with correct entry path', () => {
    const entrypoint = 'src/index.js';
    const result = generateWorkerEventHandler(entrypoint);

    expect(result).toContain(`import moduleOrFunction from '${entrypoint}'`);
    expect(result).toContain('addEventListener(eventType, (event)');
    expect(result).toContain('event.respondWith');
  });

  it('should include logic to detect handler type', () => {
    const result = generateWorkerEventHandler('app.js');

    expect(result).toContain('const hasFirewallHandler');
    expect(result).toContain('const isLegacyDefaultFunction');
    expect(result).toContain("let eventType = 'fetch'");
  });

  it('should include error handling', () => {
    const result = generateWorkerEventHandler('app.js');

    expect(result).toContain('try {');
    expect(result).toContain('catch (error) {');
    expect(result).toContain('return new Response(`Error: ${error.message}`');
  });
});

describe('normalizeEntryPointPaths', () => {
  it('should handle string entry point', () => {
    const entry = 'src/index.js';
    expect(normalizeEntryPointPaths(entry)).toEqual(['src/index.js']);
  });

  it('should handle array entry points', () => {
    const entry = ['src/index.js', 'src/worker.js'];
    expect(normalizeEntryPointPaths(entry)).toEqual([
      'src/index.js',
      'src/worker.js',
    ]);
  });

  it('should handle object entry points', () => {
    const entry = {
      'dist/main': 'src/index.js',
      'dist/worker': 'src/worker.js',
    };
    expect(normalizeEntryPointPaths(entry)).toEqual([
      'src/index.js',
      'src/worker.js',
    ]);
  });

  it('should handle empty object', () => {
    expect(normalizeEntryPointPaths({})).toEqual([]);
  });

  it('should handle empty array', () => {
    expect(normalizeEntryPointPaths([])).toEqual([]);
  });
});
