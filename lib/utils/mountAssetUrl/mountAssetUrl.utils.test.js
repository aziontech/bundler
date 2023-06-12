import assert from 'assert';
import mountAssetUrl from './index.js';

/**
 * Test the mountAssetUrl function.
 */
function testMountAssetUrl() {
  const requestURL = 'https://example.com/path/to/resource';
  const versionId = 'v1';
  const expectedAssetUrl = 'file:///v1/path/to/resource';

  const assetUrl = mountAssetUrl(requestURL, versionId);

  assert.strictEqual(assetUrl.href, expectedAssetUrl);
  console.log('mountAssetUrl test passed!');
}

testMountAssetUrl();
