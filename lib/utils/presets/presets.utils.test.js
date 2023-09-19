import presets from './index.js';

describe('getPresetsList utils', () => {
  test('Should get the list of presets based on type', async () => {
    const expectedOutput = [
      'html',
      'javascript',
      'typescript',
      'angular',
      'astro',
      'hexo',
      'next',
      'react',
      'vue',
    ];

    const result = presets.getKeys();

    expect(result).toEqual(expectedOutput);
  });
});
