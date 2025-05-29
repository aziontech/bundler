import mockFs from 'mock-fs';
import { afterEach, expect } from '@jest/globals';
import { getKeys } from './presets';

describe('getPresetsList utils', () => {
  afterEach(() => {
    mockFs.restore();
  });
  test('Should get the list of presets based on type', async () => {
    const expectedOutput = [
      'Angular',
      'Astro',
      'Docusaurus',
      'Eleventy',
      'Emscripten',
      'Gatsby',
      'HTML',
      'Hexo',
      'Hugo',
      'JavaScript',
      'Jekyll',
      'Next',
      'Nuxt',
      'Preact',
      'Qwik',
      'React',
      'RustWASM',
      'Stencil',
      'Svelte',
      'TypeScript',
      'VitePress',
      'Vue',
      'VuePress',
    ];

    const result = getKeys();

    expect(result).toEqual(expectedOutput);
  });
});
