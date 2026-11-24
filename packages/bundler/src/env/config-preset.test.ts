import { describe, it, expect } from '@jest/globals';
import type { AzionBuildPreset } from '@aziontech/config';
import { assertPresetMatchesConfig } from './config-preset';

describe('assertPresetMatchesConfig', () => {
  it('does not throw when the flag and the azion.config declare the same preset', () => {
    expect(() =>
      assertPresetMatchesConfig({ flag: 'vue', config: { build: { preset: 'vue' } } }),
    ).not.toThrow();
  });

  it('does not throw when only one of them declares a preset', () => {
    expect(() => assertPresetMatchesConfig({ flag: 'vue', config: {} })).not.toThrow();
    expect(() => assertPresetMatchesConfig({ config: { build: { preset: 'vue' } } })).not.toThrow();
    expect(() => assertPresetMatchesConfig({})).not.toThrow();
  });

  it('throws naming both presets when they differ', () => {
    expect(() =>
      assertPresetMatchesConfig({ flag: 'astro', config: { build: { preset: 'vue' } } }),
    ).toThrow(
      'Conflicting presets: --preset is "astro" but azion.config declares build.preset "vue". Remove the flag or update the "build.preset" field of your azion.config.',
    );
  });

  it('compares by name when the azion.config declares a preset object', () => {
    const vue = { metadata: { name: 'vue' } } as unknown as AzionBuildPreset;

    expect(() =>
      assertPresetMatchesConfig({ flag: 'vue', config: { build: { preset: vue } } }),
    ).not.toThrow();
    expect(() =>
      assertPresetMatchesConfig({ flag: 'astro', config: { build: { preset: vue } } }),
    ).toThrow('azion.config declares build.preset "vue"');
  });
});
