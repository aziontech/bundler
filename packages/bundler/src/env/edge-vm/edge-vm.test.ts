import { describe, it, expect } from '@jest/globals';
import { EdgeVM } from './edge-vm';

describe('EdgeVM globals', () => {
  it('provides the Web API globals', () => {
    const vm = new EdgeVM();

    expect(vm.evaluate('typeof Event')).toBe('function');
    expect(vm.evaluate('typeof Request')).toBe('function');
    expect(vm.evaluate('typeof Headers')).toBe('function');
  });

  // The worker code runs as a script, so a top-level function with the name of a global is declared in the global
  // scope. It failed with "Identifier 'Event' has already been declared" while the globals were not configurable.
  it.each(['Event', 'EventTarget', 'Request', 'Response', 'Headers', 'URL', 'TextEncoder'])(
    'lets the project declare a function named %s at the top level',
    (name) => {
      const vm = new EdgeVM();

      expect(() => vm.evaluate(`function ${name}() { this.custom = true; }`)).not.toThrow();
      expect(vm.evaluate(`new ${name}().custom`)).toBe(true);
    },
  );

  it.each([
    ['class', 'class Event { constructor(type) { this.type = type; } }'],
    ['var', 'var Event = function (type) { this.type = type; };'],
    ['assignment', 'globalThis.Event = function (type) { this.type = type; };'],
  ])('lets the project override Event with a %s', (_kind, code) => {
    const vm = new EdgeVM();

    vm.evaluate(code);

    expect(vm.evaluate('new Event("ping").type')).toBe('ping');
  });

  it('keeps the internal properties of the sandbox protected', () => {
    const vm = new EdgeVM();

    expect(() => vm.evaluate('function __onErrorHandlers() {}')).toThrow(
      /has already been declared/,
    );
  });
});
