import assert from 'assert';
import mountAssetPath from './index.js';

/**
 * Test the mountAssetPath function.
 */
function testmountAssetPath() {
  const requestURL = 'https://example.com/path/to/resource';
  const versionId = 'v1';
  const expectedAssetUrl = 'file:///v1/path/to/resource';

  const assetUrl = mountAssetPath(requestURL, versionId);

  assert.strictEqual(assetUrl.href, expectedAssetUrl);
  console.log('mountAssetPath test passed!');
}

testmountAssetPath();
