import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import type { AzionBuildPreset, AzionConfig } from '@aziontech/config';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { setupStorage } from './storage';

const preset = (storageDir?: string) =>
  ({
    metadata: { name: 'demo' },
    config: storageDir
      ? {
          storage: [
            { name: 'bucket', prefix: 'v1', dir: storageDir, workloadsAccess: 'read_only' },
          ],
        }
      : {},
  }) as unknown as AzionBuildPreset;

const v3 = { version: 3 as AzionConfig['version'] };

describe('setupStorage', () => {
  let cwd: string;
  let previousCwd: string;

  beforeEach(() => {
    previousCwd = process.cwd();
    cwd = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'storage-')));
    process.chdir(cwd);
    fs.mkdirSync('.edge/assets/_next', { recursive: true });
    fs.writeFileSync('.edge/assets/index.html', '<html></html>');
    fs.writeFileSync('.edge/assets/_next/app.js', 'console.log(1)');
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(cwd, { recursive: true, force: true });
  });

  describe('v3', () => {
    const origin = (dir?: string) => ({
      name: 'origin-storage-default',
      type: 'object_storage',
      dir,
    });
    const config = (dir?: string) => ({ ...v3, origin: [origin(dir)] }) as unknown as AzionConfig;
    const presetV3 = (dir?: string) =>
      ({
        metadata: { name: 'demo' },
        config: {},
        configs: { 3: { version: 3, origin: [origin(dir)] } },
      }) as unknown as AzionBuildPreset;

    it('copies the dir of the storage origin to the root of .edge/storage', async () => {
      await setupStorage({ config: config('.edge/assets'), preset: presetV3() });

      expect(fs.readFileSync('.edge/storage/index.html', 'utf8')).toBe('<html></html>');
      expect(fs.existsSync('.edge/storage/_next/app.js')).toBe(true);
      // no bucket/prefix folders and no symlink: the files are really there
      expect(fs.lstatSync('.edge/storage').isSymbolicLink()).toBe(false);
      expect(fs.existsSync('.edge/storage/bucket')).toBe(false);
      expect(fs.existsSync('.edge/storage/metadata.json')).toBe(false);
    });

    it('uses the dir of the v3 config of the preset when the azion.config origin has none', async () => {
      await setupStorage({ config: config(), preset: presetV3('.edge/assets') });

      expect(fs.readFileSync('.edge/storage/index.html', 'utf8')).toBe('<html></html>');
    });

    it('prefers the dir of the azion.config over the one of the preset', async () => {
      fs.mkdirSync('other');
      fs.writeFileSync('other/other.html', 'other');

      await setupStorage({ config: config('other'), preset: presetV3('.edge/assets') });

      expect(fs.existsSync('.edge/storage/other.html')).toBe(true);
      expect(fs.existsSync('.edge/storage/index.html')).toBe(false);
    });

    it('does not use the storage of the v4 config of the preset', async () => {
      await setupStorage({ config: v3, preset: preset('.edge/assets') });

      expect(fs.existsSync('.edge/storage')).toBe(false);
    });

    it('merges into what is already in .edge/storage, overwriting the files of the preset', async () => {
      fs.mkdirSync('.edge/storage/next-build-assets', { recursive: true });
      fs.writeFileSync('.edge/storage/next-build-assets/from-prebuild.js', 'kept');
      fs.writeFileSync('.edge/storage/index.html', 'stale');

      await setupStorage({ config: config('.edge/assets'), preset: presetV3() });

      expect(fs.readFileSync('.edge/storage/next-build-assets/from-prebuild.js', 'utf8')).toBe(
        'kept',
      );
      expect(fs.readFileSync('.edge/storage/index.html', 'utf8')).toBe('<html></html>');
    });

    it('does nothing without an origin with a dir', async () => {
      await expect(setupStorage({ config: config(), preset: presetV3() })).resolves.toEqual([]);
      await expect(setupStorage({ config: v3 })).resolves.toEqual([]);
      expect(fs.existsSync('.edge/storage')).toBe(false);
    });

    it('fails when the directory does not exist', async () => {
      await expect(
        setupStorage({ config: config('missing-dir'), preset: presetV3() }),
      ).rejects.toThrow('Storage directory not found');
    });
  });

  describe('v4', () => {
    it('keeps linking the storage dir under .edge/storage/<bucket>/<prefix>', async () => {
      const config = {
        storage: [
          { name: 'bucket', prefix: 'v1', dir: '.edge/assets', workloadsAccess: 'read_only' },
        ],
      } as AzionConfig;

      await setupStorage({ config, preset: preset('.edge/assets') });

      expect(fs.lstatSync('.edge/storage/bucket/v1').isSymbolicLink()).toBe(true);
      expect(fs.existsSync('.edge/storage/bucket/v1/index.html')).toBe(true);
      expect(fs.existsSync('.edge/storage/index.html')).toBe(false);
    });
  });
});
