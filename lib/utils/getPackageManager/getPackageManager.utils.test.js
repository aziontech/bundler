import mockFs from 'mock-fs';
import { afterEach, beforeEach } from '@jest/globals';
import getPackageManager from './index.js';

describe('getPackageManager utils', () => {
  beforeEach(() => {
    jest.spyOn(Map.prototype, 'set').mockReturnValue(undefined);
  });
  afterEach(() => {
    mockFs.restore();
  });

  test('Should detect the yarn package manager being used.', async () => {
    mockFs({
      'yarn.lock': {
        name: 'next',
        version: '0.1.0',
      },
    });
    const expectedOutput = 'yarn';

    const result = await getPackageManager();
    expect(result).toBe(expectedOutput);
  });

  test('Should detect the npm package manager being used.', async () => {
    mockFs({
      'package-lock.json': {
        name: 'next',
        version: '0.1.0',
      },
    });
    const expectedOutput = 'npm';

    const result = await getPackageManager();
    expect(result).toBe(expectedOutput);
  });

  test('Should detect the pnpm package manager being used.', async () => {
    mockFs({
      'pnpm-lock.yaml': {
        name: 'next',
        version: '0.1.0',
      },
    });
    const expectedOutput = 'pnpm';

    const result = await getPackageManager();
    expect(result).toBe(expectedOutput);
  });
});
