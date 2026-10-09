import mockFs from 'mock-fs';
import { describe, afterEach, test, expect } from '@jest/globals';
import { getKeys, getPresetConfig } from './presets';

describe('getPresetsList utils', () => {
  afterEach(() => {
    mockFs.restore();
  });
  test('Should get the list of presets based on type', async () => {
    const expectedOutput = [
      'angular',
      'astro',
      'docusaurus',
      'eleventy',
      'emscripten',
      'gatsby',
      'hexo',
      'html',
      'hugo',
      'javascript',
      'jekyll',
      'next',
      'nitro',
      'nuxt',
      'opennextjs',
      'preact',
      'qwik',
      'react',
      'rustwasm',
      'stencil',
      'svelte',
      'typescript',
      'vitepress',
      'vue',
      'vuepress',
    ];

    const result = getKeys();

    expect(result).toEqual(expectedOutput);
  });

  test('Should get config for a valid preset', () => {
    const result = getPresetConfig('react');

    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
    expect(result).toHaveProperty('build');
    expect(result).toHaveProperty('applications');
  });

  test('Should throw error for invalid preset', () => {
    expect(() => {
      getPresetConfig('invalid-preset');
    }).toThrow("Preset 'invalid-preset' not found. Run 'ef presets ls' to see available presets.");
  });

  test('Should return different configs for different presets', () => {
    const reactConfig = getPresetConfig('react');
    const vueConfig = getPresetConfig('vue');

    expect(reactConfig).toBeDefined();
    expect(vueConfig).toBeDefined();
    // Both should be objects but potentially have different configurations
    expect(typeof reactConfig).toBe('object');
    expect(typeof vueConfig).toBe('object');
  });

  describe('config version', () => {
    test('Should default to the v4 config', () => {
      expect(getPresetConfig('react')).toHaveProperty('applications');
      expect(getPresetConfig('react')).toEqual(getPresetConfig('react', 4));
    });

    test.each(['3', 3, 'v3'])('Should get the v3 config with version %p', (version) => {
      const result = getPresetConfig('react', version);

      expect(result).toMatchObject({ version: 3, build: { preset: 'react' } });
      expect(result).toHaveProperty('origin');
      expect(result).not.toHaveProperty('applications');
    });

    test('Should throw for a version the preset does not support', () => {
      expect(() => getPresetConfig('nitro', 3)).toThrow('does not support config version 3');
    });

    test('Should throw for an invalid version', () => {
      expect(() => getPresetConfig('react', '5')).toThrow('Invalid config version "5"');
    });
  });
});
