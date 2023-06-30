import fs from 'fs/promises';
import readWorkerFile from './index.js';

describe('readWorkerFile utils', () => {
  test('Should read the content of a worker file.', async () => {
    // Create a test file
    const filePath = './testFile.js';
    const testContent = 'console.log("Hello, World!");';

    await fs.writeFile(filePath, testContent);

    // Use readWorkerFile function to load code from the test file
    const workerCode = await readWorkerFile(filePath);

    // Expected content is the same as the content of the file created
    const expectedContent = testContent;

    // Assert that the workerCode is same as expectedContent
    expect(workerCode).toBe(expectedContent);

    // Cleanup: remove the test file
    await fs.unlink(filePath);
  });
});
