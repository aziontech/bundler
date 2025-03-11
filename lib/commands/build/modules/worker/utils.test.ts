import { describe, it, expect } from '@jest/globals';
import { createEventHandlerCode } from './utils';

describe('createEventHandlerCode', () => {
  it('should generate handler code with correct entry path', () => {
    const entrypoint = 'src/index.js';
    const result = createEventHandlerCode(entrypoint);

    expect(result).toContain(`import moduleOrFunction from '${entrypoint}'`);
    expect(result).toContain('addEventListener(eventType, (event)');
    expect(result).toContain('event.respondWith');
  });

  it('should include logic to detect handler type', () => {
    const result = createEventHandlerCode('app.js');

    expect(result).toContain('const hasFirewallHandler');
    expect(result).toContain('const isLegacyDefaultFunction');
    expect(result).toContain("let eventType = 'fetch'");
  });

  it('should include error handling', () => {
    const result = createEventHandlerCode('app.js');

    expect(result).toContain('try {');
    expect(result).toContain('catch (error) {');
    expect(result).toContain('return new Response(`Error: ${error.message}`');
  });
});
