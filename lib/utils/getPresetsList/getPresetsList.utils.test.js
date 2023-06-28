import getPresetsList from './index.js';

describe('getPresetsList utils', () => {
  test('Should get the list of presets based on type', async () => {
    const expectedOutput = [
      'Astro (Static)',
      'Hexo (Static)',
      'Next (Static)',
      'React (Static)',
      'Vanilla (Server)',
      'Vue (Static)',
    ];

    const result = getPresetsList();

    expect(result).toEqual(expectedOutput);
  });
});
