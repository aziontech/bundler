import assert from 'assert';
import fs from 'fs/promises';
import readWorkerFile from './index.js';

/**
 * Test the readWorkerFile function.
 */
async function testReadWorkerFile() {
  // Create a test file
  const filePath = './testFile.js';
  const testContent = 'console.log("Hello, World!");';
  await fs.writeFile(filePath, testContent);

  // Use readWorkerFile function to load code from the test file
  const workerCode = await readWorkerFile(filePath);

  // Expected content is the same as the content of the file created
  const expectedContent = testContent;

  // Assert that the workerCode is same as expectedContent
  assert.strictEqual(workerCode, expectedContent);
  console.log('readWorkerFile test passed!');

  // Cleanup: remove the test file
  await fs.unlink(filePath);
}

// Run the test
testReadWorkerFile();
