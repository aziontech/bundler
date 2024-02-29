const { describe } = require('@jest/globals');
const { default: mountSSG } = require('./mountSSG.hooks.js');

describe('mountSSG', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch.mockRestore();
  });

  it('should construct the assetPath for assets correctly', async () => {
    const requestURL = 'http://example.com/assets/image.png';

    const expectedAssetPath = new URL(`assets/image.png`, 'file://');

    global.fetch.mockResolvedValue({});

    return mountSSG(requestURL).then(() => {
      expect(global.fetch).toHaveBeenCalledWith(expectedAssetPath);
    });
  });

  it('should construct a requestPath that does not have a file extension', async () => {
    const requestURL = 'http://example.com/';

    const expectedAssetPath = new URL(`/index.html`, 'file://');

    global.fetch.mockResolvedValue({});

    return mountSSG(requestURL).then(() => {
      expect(global.fetch).toHaveBeenCalledWith(expectedAssetPath);
    });
  });
});
