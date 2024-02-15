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
      'html',
      'javascript',
      'typescript',
      'angular',
      'astro',
      'emscripten',
      'gatsby',
      'hexo',
      'hugo',
      'next',
      'react',
      'rustwasm',
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

    expect(fs.existsSync('lib/presets/custom/MyPreset/deliver')).toBe(true);
  });

  it('Should test set function with compute parameter', () => {
    mockFs({
      lib: {
        presets: {
          custom: {},
          default: {
            javascript: {
              compute: {
                'handler.js': '',
                'config.js': '',
                'prebuild.js': '',
              },
            },
          },
        },
      },
    });

    presets.set('MyPreset', 'compute');

    expect(
      fs.existsSync('lib/presets/custom/MyPreset/compute/handler.js'),
    ).toBe(true);
    expect(fs.existsSync('lib/presets/custom/MyPreset/compute/config.js')).toBe(
      true,
    );
    expect(
      fs.existsSync('lib/presets/custom/MyPreset/compute/prebuild.js'),
    ).toBe(true);
  });

  it('Should list presets beatified', () => {
    const expectedResult = [
      'Html (Deliver)',
      'Javascript (Compute)',
      'Typescript (Compute)',
      'Angular (Deliver)',
      'Astro (Deliver)',
      'Emscripten (Compute)',
      'Gatsby (Deliver)',
      'Hexo (Deliver)',
      'Hugo (Deliver)',
      'Next (Compute)',
      'Next (Deliver)',
      'React (Deliver)',
      'Rustwasm (Compute)',
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
      'emscripten',
      'hexo',
      'hugo',
      'next',
      'react',
      'rustwasm',
      'vue',
    ];
    const expectedOutput = [
      ['Deliver'],
      ['Compute'],
      ['Compute'],
      ['Deliver'],
      ['Deliver'],
      ['Compute'],
      ['Deliver'],
      ['Deliver'],
      ['Compute', 'Deliver'],
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
