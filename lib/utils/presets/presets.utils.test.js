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

  it('Should list presets beatified', () => {
    const expectedResult = [
      'Angular (Deliver)',
      'Astro (Deliver)',
      'Eleventy (Deliver)',
      'Emscripten (Compute)',
      'Gatsby (Deliver)',
      'Hexo (Deliver)',
      'Html (Deliver)',
      'Hugo (Deliver)',
      'Javascript (Compute)',
      'Jekyll (Deliver)',
      'Next (Compute)',
      'Next (Deliver)',
      'React (Deliver)',
      'Rustwasm (Compute)',
      'Svelte (Deliver)',
      'Typescript (Compute)',
      'Vue (Deliver)',
    ];
    const beautifiedResults = presets.getBeautify();
    expect(beautifiedResults).toEqual(expectedResult);
  });

  it('Should list modes for a given preset', () => {
    const modesAvailable = [
      'html',
      'javascript',
      'typescript',
      'angular',
      'astro',
      'eleventy',
      'emscripten',
      'hexo',
      'hugo',
      'jekyll',
      'next',
      'react',
      'svelte',
      'rustwasm',
      'vue',
    ];
    const expectedOutput = [
      ['Deliver'],
      ['Compute'],
      ['Compute'],
      ['Deliver'],
      ['Deliver'],
      ['Deliver'],
      ['Compute'],
      ['Deliver'],
      ['Deliver'],
      ['Deliver'],
      ['Compute', 'Deliver'],
      ['Deliver'],
      ['Deliver'],
      ['Compute'],
      ['Deliver'],
    ];

    modesAvailable.forEach((mode, index) => {
      const availableModes = presets.getModes(mode);
      expect(availableModes).toEqual(expectedOutput[index]);
    });
  });
});
