import assert from 'assert';
import mountSPA from './index.js';

/**
 * Test the mountSPA function.
 */
function testmountSPA() {
  const requestURL = 'https://example.com/path/to/resource';
  const versionId = 'v1';
  const expectedAssetUrl = 'file:///v1/path/to/resource';

  const assetUrl = mountSPA(requestURL, versionId);

  assert.strictEqual(assetUrl.href, expectedAssetUrl);
  console.log('mountSPA test passed!');
}

testmountSPA();
