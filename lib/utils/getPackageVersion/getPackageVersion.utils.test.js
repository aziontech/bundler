import mockFs from 'mock-fs';
import getPackageVersion from './index.js';

describe('getPackageVersion utils', () => {
  beforeAll(() => {
    mockFs({
      'package.json': '{ "dependencies": { "next": "13.3.4" } }',
    });
  });

  afterAll(() => {
    mockFs.restore();
  });

  test('Should get package version from user project.', async () => {
    const expectedOutput = '13.3.4';

    const version = getPackageVersion('next');

    expect(version).toBe(expectedOutput);
  });

  test('Should throw an ERROR when package name is invalid', async () => {
    const expectedOutput = 'Invalid package name!';

    expect(() => getPackageVersion('')).toThrow(expectedOutput);
  });

  test('Should throw an ERROR when package is NOT found', async () => {
    const expectedOutput = "'other' not detected in project dependencies!";

    expect(() => getPackageVersion('other')).toThrow(expectedOutput);
  });
});
