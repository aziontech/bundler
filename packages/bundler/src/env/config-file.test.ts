import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveConfigFile } from './config-file';
import { readAzionConfig } from './bundler';

describe('config file (--config-file)', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'azion-config-file-')));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('resolveConfigFile', () => {
    it('returns undefined when no config file is given, so the default search is kept', () => {
      expect(resolveConfigFile()).toBeUndefined();
      expect(resolveConfigFile('')).toBeUndefined();
    });

    it('resolves a relative path from the cwd', () => {
      fs.writeFileSync(path.join(tempDir, 'custom.config.mjs'), 'export default {}');

      expect(resolveConfigFile('./custom.config.mjs')).toBe(
        path.join(tempDir, 'custom.config.mjs'),
      );
    });

    it('keeps an absolute path', () => {
      const file = path.join(tempDir, 'custom.config.mjs');
      fs.writeFileSync(file, 'export default {}');

      expect(resolveConfigFile(file)).toBe(file);
    });

    it('throws when the file does not exist, instead of falling back to the default search', () => {
      fs.writeFileSync(path.join(tempDir, 'azion.config.mjs'), 'export default {}');

      expect(() => resolveConfigFile('missing.config.ts')).toThrow(
        `Config file not found: ${path.join(tempDir, 'missing.config.ts')}`,
      );
    });

    it('throws when the path is a directory', () => {
      fs.mkdirSync(path.join(tempDir, 'configs'));

      expect(() => resolveConfigFile('configs')).toThrow('Config file not found');
    });
  });

  describe('readAzionConfig with an explicit path', () => {
    it('loads the given file instead of the azion.config found in the cwd', async () => {
      fs.writeFileSync(
        path.join(tempDir, 'azion.config.mjs'),
        "export default { build: { preset: 'default-file' } }",
      );
      fs.writeFileSync(
        path.join(tempDir, 'staging.config.mjs'),
        "export default { build: { preset: 'staging-file' } }",
      );

      const config = await readAzionConfig(path.join(tempDir, 'staging.config.mjs'));

      expect(config?.build?.preset).toBe('staging-file');
    });

    it('loads a TypeScript config file', async () => {
      fs.writeFileSync(
        path.join(tempDir, 'azion.staging.ts'),
        "export default { build: { preset: 'typescript' } } as const;",
      );

      const config = await readAzionConfig(path.join(tempDir, 'azion.staging.ts'));

      expect(config?.build?.preset).toBe('typescript');
    });

    it('still searches the cwd when no path is given', async () => {
      fs.writeFileSync(
        path.join(tempDir, 'azion.config.mjs'),
        "export default { build: { preset: 'default-file' } }",
      );

      const config = await readAzionConfig();

      expect(config?.build?.preset).toBe('default-file');
    });
  });
});
