// import assert from 'assert';
// import { feedback } from '#utils';
import { describe, it } from '@jest/globals';
import mountSPA from './index.js';

/**
 * Test the mountSPA function.
 */
describe('mountSPA', () => {
  // Mock the fetch function before each test
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  // Restore the original fetch function after each test
  afterEach(() => {
    global.fetch.mockRestore();
  });

  it('should construct the assetPath for assets correctly', () => {
    const requestURL = 'http://example.com/assets/image.png';
    const versionId = 'v1';

    const expectedAssetPath = new URL('/v1/assets/image.png', 'file://');

    // Mock the fetch response
    global.fetch.mockResolvedValue({
      // Define the expected response here
      // For example, you can mock a Response object with status, json() method, etc.
    });

    // Call your function and make assertions
    return mountSPA(requestURL, versionId).then(() => {
      // Add your assertions here
      expect(global.fetch).toHaveBeenCalledWith(expectedAssetPath);
      // Add more assertions based on your specific use case
    });
  });

  // Add more test cases as needed
});
