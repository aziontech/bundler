import { describe, it } from '@jest/globals';
import mountSPA from './index.js';

describe('mountSPA', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockRestore();
  });

  it('should construct the assetPath for assets correctly', async () => {
    const requestURL = 'http://example.com/assets/image.png';
    const versionId = '1234567890';

    const expectedAssetPath = new URL(
      `/${versionId}/assets/image.png`,
      'file://',
    );

    global.fetch.mockResolvedValue({});

    return mountSPA(requestURL, versionId).then(() => {
      expect(global.fetch).toHaveBeenCalledWith(expectedAssetPath);
    });
  });

  it('should construct a requestPath that does not have a file extension', async () => {
    const requestURL = 'http://example.com/';
    const versionId = '1234567890';

    const expectedAssetPath = new URL(`/${versionId}/index.html`, 'file://');

    global.fetch.mockResolvedValue({});

    return mountSPA(requestURL, versionId).then(() => {
      expect(global.fetch).toHaveBeenCalledWith(expectedAssetPath);
    });
  });
});
