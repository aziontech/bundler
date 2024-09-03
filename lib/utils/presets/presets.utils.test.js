import mockFs from 'mock-fs';
import fs from 'fs';
import { afterEach, expect } from '@jest/globals';
import presets from './index.js';

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

  it('Should test set function with deliver parameter', () => {
    mockFs({
      lib: {
        presets: {
          custom: {},
        },
      },
    });

    presets.set('MyPreset', 'deliver');

    expect(fs.existsSync('lib/presets/MyPreset/deliver')).toBe(true);
  });

  it('Should test set function with compute parameter', () => {
    mockFs({
      lib: {
        presets: {
          custom: {},
          javascript: {
            compute: {
              'handler.js': '',
              'config.js': '',
              'prebuild.js': '',
            },
          },
        },
      },
    });

    presets.set('MyPreset', 'compute');

    expect(fs.existsSync('lib/presets/MyPreset/compute/handler.js')).toBe(true);
    expect(fs.existsSync('lib/presets/MyPreset/compute/config.js')).toBe(true);
    expect(fs.existsSync('lib/presets/MyPreset/compute/prebuild.js')).toBe(
      true,
    );
  });
});
