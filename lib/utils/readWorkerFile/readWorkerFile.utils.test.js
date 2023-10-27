import mockFs from 'mock-fs';
import readWorkerFile from './index.js';

describe('readWorkerFile utils', () => {
  test('Should read the content of a worker file.', async () => {
    mockFs({
      'testFile.js': 'console.log("Hello, World!");',
    });

    const filePath = './testFile.js';
    const expectedContent = 'console.log("Hello, World!");';

    const workerCode = await readWorkerFile(filePath);

    expect(workerCode).toBe(expectedContent);

    mockFs.restore();
  });

  test('Should try to read the content of invalid path and fail.', async () => {
    const expectMessage = 'File does not exist.';
    const invalidPath = './invalidPath/testFile.js';

    await expect(readWorkerFile(invalidPath)).rejects.toThrow(expectMessage);
  });
});
