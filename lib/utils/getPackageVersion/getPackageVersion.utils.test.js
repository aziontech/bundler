import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import getPackageVersion from './index.js';

const FILE_NAME = 'package.json';
const CURRENT_DIR = process.cwd();
const TMP_DIR = tmpdir();
const FILE_PATH = join(TMP_DIR, FILE_NAME);

describe('getPackageVersion utils', () => {
  beforeAll(() => {
    writeFileSync(FILE_PATH, `
    {
      "dependencies": {
        "next": "13.3.4"
      }
    }
    `);

    process.chdir(TMP_DIR);
  });

  afterAll(() => {
    process.chdir(CURRENT_DIR);
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
    const expectedOutput = '\'other\' not detected in project dependencies!';

    expect(() => getPackageVersion('other')).toThrow(expectedOutput);
  });
});
