import mockFs from 'mock-fs';
import injectFilesInMem from './injectFilesInMem.utils.js';

describe('injectFilesInMem', () => {
  beforeEach(() => {
    mockFs({
      '/path/to/dir1': {
        'file1.txt': 'File 1 Content',
        subDir: {
          'file2.txt': 'File 2 Content',
        },
      },
      '/path/to/dir2': {
        'file3.txt': 'File 3 Content',
      },
    });
  });

  afterEach(() => {
    mockFs.restore();
  });

  it('should inject files into memory', async () => {
    const codeToInject = await injectFilesInMem([
      '/path/to/dir1',
      '/path/to/dir2',
    ]);

    expect(codeToInject).toContain('globalThis.__FILES__');

    const strData = codeToInject
      .replace('globalThis.__FILES__=', '')
      .replace('};', '}');
    const data = JSON.parse(strData);

    expect(data['/path/to/dir1/file1.txt'].content).toBe(
      'RmlsZSAxIENvbnRlbnQ=',
    );

    expect(data['/path/to/dir1/subDir/file2.txt'].content).toBe(
      'RmlsZSAyIENvbnRlbnQ=',
    );

    expect(data['/path/to/dir2/file3.txt'].content).toBe(
      'RmlsZSAzIENvbnRlbnQ=',
    );
  });
});
