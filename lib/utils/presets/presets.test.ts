import mockFs from 'mock-fs';
import { afterEach, expect } from '@jest/globals';
import presets from './presets';

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
      'preact',
      'qwik',
      'react',
      'rustwasm',
      'svelte',
      'typescript',
      'vitepress',
      'vue',
    ];

    const result = presets.getKeys();

    expect(result).toEqual(expectedOutput);
  });
});
