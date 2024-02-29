import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import getProjectJsonFile from './index.js';

const FILE_NAME = 'package.json';
const CURRENT_DIR = process.cwd();
const TMP_DIR = tmpdir();
const FILE_PATH = join(TMP_DIR, FILE_NAME);

describe('getProjectJsonFile utils', () => {
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

  test('Should read a json file content', async () => {
    const expectedOutput = {
      name: 'next',
      version: '0.1.0',
    };

    const result = getProjectJsonFile(FILE_NAME);

    expect(result.name).toBe(expectedOutput.name);
    expect(result.version).toBe(expectedOutput.version);
  });
});
