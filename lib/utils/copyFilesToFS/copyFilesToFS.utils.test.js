import mockFs from 'mock-fs';
import fs from 'fs';
import copyFilesToFS from './copyFilesToFS.utils.js';

describe('copyFilesToFS', () => {
  beforeEach(() => {
    mockFs({
      dir1: {
        'file1.txt': 'content1',
      },
      dir2: {
        'file2.txt': 'content2',
        subdir: {
          'file3.txt': 'content3',
        },
      },
      '.edge/storage': {},
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('should copy directories to .edge/storage', () => {
    const dirs = ['dir1', 'dir2'];
    copyFilesToFS(dirs);

    expect(fs.existsSync('.edge/storage/dir1/file1.txt')).toBe(true);
    expect(fs.readFileSync('.edge/storage/dir1/file1.txt', 'utf8')).toBe(
      'content1',
    );

    expect(fs.existsSync('.edge/storage/dir2/file2.txt')).toBe(true);
    expect(fs.readFileSync('.edge/storage/dir2/file2.txt', 'utf8')).toBe(
      'content2',
    );

    expect(fs.existsSync('.edge/storage/dir2/subdir/file3.txt')).toBe(true);
    expect(fs.readFileSync('.edge/storage/dir2/subdir/file3.txt', 'utf8')).toBe(
      'content3',
    );
  });
});
