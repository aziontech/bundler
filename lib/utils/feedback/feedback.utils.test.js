import feedback from './index.js';

describe('feedback utils', () => {
  test('Should create a feedback object that facilitates log display.', async () => {
    const prebuildInfo = feedback.prebuild.info;
    const prebuildError = feedback.prebuild.error;

    expect(typeof prebuildInfo).toBe('function');
    expect(typeof prebuildError).toBe('function');
  });
});
