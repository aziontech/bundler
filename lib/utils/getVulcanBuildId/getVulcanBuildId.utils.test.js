import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import getVulcanBuildId from './index.js';

const FILE_NAME = '.env';
const FILE_DIR = '.edge';
const CURRENT_DIR = process.cwd();
const TMP_DIR = tmpdir();
const DIR_PATH = join(TMP_DIR, FILE_DIR);
const FILE_PATH = join(TMP_DIR, FILE_DIR, FILE_NAME);

describe('getVulcanBuildId utils', () => {
  beforeAll(() => {
    process.chdir(TMP_DIR);

    mkdirSync(DIR_PATH);

    writeFileSync(FILE_PATH, 'VERSION_ID=20230627142534');
  });

  afterAll(() => {
    process.chdir(CURRENT_DIR);

    rmSync(DIR_PATH, { recursive: true, force: true });
  });

  test('Should fetch the unique build ID for the current project', async () => {
    const expectedOutput = '20230627142534';

    const result = getVulcanBuildId();

    expect(result).toBe(expectedOutput);
  });
});
