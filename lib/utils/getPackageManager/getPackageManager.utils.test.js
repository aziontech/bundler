import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import getPackageManager from './index.js';

const FILE_NAME = 'yarn.lock';
const CURRENT_DIR = process.cwd();
const TMP_DIR = tmpdir();
const FILE_PATH = join(TMP_DIR, FILE_NAME);

describe('getPackageManager utils', () => {
  beforeAll(() => {
    writeFileSync(
      FILE_PATH,
      `
    {
      "name": "next",
      "version": "0.1.0"
    }
    `,
    );

    process.chdir(TMP_DIR);
  });

  afterAll(() => {
    process.chdir(CURRENT_DIR);
  });

  test('Should detect the package manager (npm, yarn, pnpm) being used.', async () => {
    const expectedOutput = 'yarn';

    const result = await getPackageManager();

    expect(result).toBe(expectedOutput);
  });
});
