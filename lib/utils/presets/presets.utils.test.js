import getPresetsList from './index.js';

describe('getPresetsList utils', () => {
  test('Should get the list of presets based on type', async () => {
    const expectedOutput = [
      'Javascript (Compute)',
      'Typescript (Compute)',
      'Astro (Deliver)',
      'Hexo (Deliver)',
      'Next (Deliver)',
      'React (Deliver)',
      'Vue (Deliver)',
    ];

    const result = getPresetsList();

    expect(result).toEqual(expectedOutput);
  });
});
