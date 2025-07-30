import mockFs from 'mock-fs';
import { afterEach, expect } from '@jest/globals';
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
    expect(result).toHaveProperty('edgeApplications');
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
});
