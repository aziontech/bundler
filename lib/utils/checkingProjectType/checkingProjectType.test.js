import mockFs from 'mock-fs';
import checkingProjectTypeJS from './checkingProjectType.utils.js';

describe('checkingProjectType utils', () => {
  describe('checkingProjectTypeJS', () => {
    it('should return the correct project type typescript', async () => {
      mockFs({
        'tsconfig.json': 'content',
        'file.ts': 'content',
      });
      const isTypeScript = await checkingProjectTypeJS();
      expect(isTypeScript).toBe('typescript');
      mockFs.restore();
    });

    it('should return the correct project type javascript', async () => {
      mockFs({
        'file.js': 'content',
      });
      const isTypeScript = await checkingProjectTypeJS();
      expect(isTypeScript).toBe('javascript');
      mockFs.restore();
    });
  });
});
