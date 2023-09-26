import {
  mkdtempSync,
  writeFileSync,
  mkdirSync,
  rmdirSync,
  existsSync,
  readFileSync,
} from 'fs';
import { join } from 'path';

import copyDirectory from './index.js';

describe('copyDirectory utils', () => {
  let sourceDir;
  let targetDir;

  beforeAll(async () => {
    sourceDir = mkdtempSync(join(__dirname, 'tmp-source'));
    targetDir = mkdtempSync(join(__dirname, 'tmp-target'));

    writeFileSync(join(sourceDir, 'file1.txt'), 'Test example 1.');
    mkdirSync(join(sourceDir, 'subdir'));
    writeFileSync(join(sourceDir, 'subdir', 'file2.txt'), 'Text example 2.');
  });

  afterAll(() => {
    rmdirSync(sourceDir, { recursive: true });
    rmdirSync(targetDir, { recursive: true });
  });

  test('Should recursively copy a directory to the target directory.', async () => {
    copyDirectory(sourceDir, targetDir);

    const copiedFile1 = existsSync(join(targetDir, 'file1.txt'));
    const copiedFile2 = existsSync(join(targetDir, 'subdir', 'file2.txt'));

    expect(copiedFile1).toBeTruthy();
    expect(copiedFile2).toBeTruthy();

    const originalFile1Contents = readFileSync(
      join(sourceDir, 'file1.txt'),
      'utf-8',
    );
    const originalFile2Contents = readFileSync(
      join(sourceDir, 'subdir', 'file2.txt'),
      'utf-8',
    );
    const copiedFile1Contents = readFileSync(
      join(targetDir, 'file1.txt'),
      'utf-8',
    );
    const copiedFile2Contents = readFileSync(
      join(targetDir, 'subdir', 'file2.txt'),
      'utf-8',
    );

    expect(copiedFile1Contents).toBe(originalFile1Contents);
    expect(copiedFile2Contents).toBe(originalFile2Contents);
  });
});
