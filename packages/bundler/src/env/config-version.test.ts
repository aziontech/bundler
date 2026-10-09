import { describe, it, expect } from '@jest/globals';
import { parseConfigVersion, resolveConfigVersion } from './config-version';

describe('parseConfigVersion', () => {
  it.each([
    [3, 3],
    ['3', 3],
    ['v3', 3],
    ['V4', 4],
    [' 4 ', 4],
  ])('parses %p as %p', (input, expected) => {
    expect(parseConfigVersion(input)).toBe(expected);
  });

  it.each([undefined, null, ''])('returns undefined for %p', (input) => {
    expect(parseConfigVersion(input)).toBeUndefined();
  });

  it.each(['5', 'abc', 99, '3.5', true])('rejects %p listing the supported versions', (input) => {
    expect(() => parseConfigVersion(input)).toThrow(
      /Invalid config version .*Supported versions: 3, 4\./,
    );
  });
});

describe('resolveConfigVersion', () => {
  it('defaults to v4 so existing projects keep working', () => {
    expect(resolveConfigVersion({})).toBe(4);
    expect(resolveConfigVersion({ config: { build: {} } as { version?: unknown } })).toBe(4);
    expect(resolveConfigVersion({ config: null })).toBe(4);
  });

  it('uses the version declared in azion.config', () => {
    expect(resolveConfigVersion({ config: { version: 3 } })).toBe(3);
  });

  it('uses the flag when azion.config does not declare a version', () => {
    expect(resolveConfigVersion({ flag: '3', config: {} })).toBe(3);
    expect(resolveConfigVersion({ flag: '3' })).toBe(3);
  });

  it('accepts a flag that matches azion.config', () => {
    expect(resolveConfigVersion({ flag: '3', config: { version: 3 } })).toBe(3);
  });

  it('fails when the flag and azion.config disagree', () => {
    expect(() => resolveConfigVersion({ flag: '3', config: { version: 4 } })).toThrow(
      'Conflicting config versions: --config-version is 3 but azion.config declares version 4.',
    );
  });

  it('fails for an unsupported version declared in azion.config', () => {
    expect(() => resolveConfigVersion({ config: { version: 99 } })).toThrow(
      'Invalid config version "99"',
    );
  });
});
