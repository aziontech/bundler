import mockFS from 'mock-fs';
import generateWebpackBanner from './generateWebpackBanner.utils.js';

describe('generateWebpackBanner', () => {
  it('should generate a webpack banner', () => {
    const arrayOfPaths = ['path/to/file1.js', 'path/to/file2.js'];
    const expectedBanner = 'file-1-content\nfile-2-content\n';
    mockFS({
      path: {
        to: {
          'file1.js': 'file-1-content',
          'file2.js': 'file-2-content',
        },
      },
    });

    const bannerArray = generateWebpackBanner(arrayOfPaths);

    expect(bannerArray).toBe(expectedBanner);
    mockFS.restore();
  });
});
