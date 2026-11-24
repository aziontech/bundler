import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { feedback } from '@aziontech/utils/node';
import type { AzionBuildPreset, AzionConfig } from '@aziontech/config';
import { verifySkippedFrameworkBuildOutput } from './utils';

describe('verifySkippedFrameworkBuildOutput', () => {
  let cwd: string;
  let project: string;
  let warn: jest.SpiedFunction<typeof feedback.build.warn>;

  const configWith = (...dirs: string[]) =>
    ({ storage: dirs.map((dir, i) => ({ name: `bucket-${i}`, dir })) }) as unknown as AzionConfig;

  beforeEach(() => {
    cwd = process.cwd();
    project = mkdtempSync(join(tmpdir(), 'skip-framework-build-'));
    process.chdir(project);
    warn = jest.spyOn(feedback.build, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    process.chdir(cwd);
    rmSync(project, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('does not warn when the directory has files', async () => {
    mkdirSync('.edge/assets', { recursive: true });
    writeFileSync('.edge/assets/index.html', '<html></html>');

    await expect(verifySkippedFrameworkBuildOutput(configWith('./.edge/assets'))).resolves.toEqual(
      [],
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when the directory is empty', async () => {
    mkdirSync('.edge/assets', { recursive: true });

    await expect(verifySkippedFrameworkBuildOutput(configWith('./.edge/assets'))).resolves.toEqual([
      './.edge/assets',
    ]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"./.edge/assets" is empty'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('--skip-framework-build'));
  });

  it('warns when the directory does not exist', async () => {
    await expect(verifySkippedFrameworkBuildOutput(configWith('./dist'))).resolves.toEqual([
      './dist',
    ]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"./dist" is missing'));
  });

  it('names the preset so a preset that does not match the project can be spotted', async () => {
    const preset = { metadata: { name: 'astro' } } as unknown as AzionBuildPreset;

    await verifySkippedFrameworkBuildOutput(configWith('./.edge/assets'), preset);

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Check that the preset ("astro") matches your project'),
    );
  });

  it('still hints at the preset when its name is unknown', async () => {
    await verifySkippedFrameworkBuildOutput(configWith('./dist'));

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('Check that the preset matches your project'),
    );
  });

  it('reports each directory once', async () => {
    await verifySkippedFrameworkBuildOutput(configWith('./dist', './dist'));
    expect(warn).toHaveBeenCalledTimes(1);
  });

  describe('v3 (object_storage origin)', () => {
    const v3Config = (dir?: string) =>
      ({
        version: 3,
        origin: [{ name: 'origin-storage', type: 'object_storage', ...(dir && { dir }) }],
      }) as unknown as AzionConfig;

    it('warns when the origin dir is empty', async () => {
      mkdirSync('.edge/assets', { recursive: true });

      await expect(verifySkippedFrameworkBuildOutput(v3Config('./.edge/assets'))).resolves.toEqual([
        './.edge/assets',
      ]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('"./.edge/assets" is empty'));
    });

    it('warns when the origin dir does not exist', async () => {
      await expect(verifySkippedFrameworkBuildOutput(v3Config('./dist'))).resolves.toEqual([
        './dist',
      ]);
    });

    it('does not warn when the origin dir has files', async () => {
      mkdirSync('dist');
      writeFileSync('dist/index.html', '<html></html>');

      await expect(verifySkippedFrameworkBuildOutput(v3Config('./dist'))).resolves.toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    const presetWithV3Dir = (dir?: string) =>
      ({
        metadata: { name: 'test' },
        configs: {
          3: { origin: [{ name: 'storage', type: 'object_storage', ...(dir && { dir }) }] },
        },
      }) as unknown as AzionBuildPreset;

    it('uses the dir of the v3 config of the preset when the azion.config origin has none', async () => {
      // .edge/storage is only filled from that dir later (storage setup), so it must not be reported
      mkdirSync('dist');
      writeFileSync('dist/index.html', '<html></html>');

      await expect(
        verifySkippedFrameworkBuildOutput(v3Config(), presetWithV3Dir('./dist')),
      ).resolves.toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('warns about the dir of the preset when it is empty', async () => {
      mkdirSync('dist');

      await expect(
        verifySkippedFrameworkBuildOutput(v3Config(), presetWithV3Dir('./dist')),
      ).resolves.toEqual(['./dist']);
    });

    it('falls back to .edge/storage when neither the origin nor the preset declare a dir', async () => {
      mkdirSync('.edge/storage', { recursive: true });

      await expect(
        verifySkippedFrameworkBuildOutput(v3Config(), presetWithV3Dir()),
      ).resolves.toEqual(['.edge/storage']);
    });

    it('falls back to .edge/storage when the object_storage origin has no dir', async () => {
      mkdirSync('.edge/storage', { recursive: true });

      await expect(verifySkippedFrameworkBuildOutput(v3Config())).resolves.toEqual([
        '.edge/storage',
      ]);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('".edge/storage" is empty'));
    });

    it('does not warn when .edge/storage has files and the origin has no dir', async () => {
      mkdirSync('.edge/storage', { recursive: true });
      writeFileSync('.edge/storage/index.html', '<html></html>');

      await expect(verifySkippedFrameworkBuildOutput(v3Config())).resolves.toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });

    it('does nothing when there is no object_storage origin', async () => {
      const config = { version: 3, origin: [{ name: 'api', type: 'single_origin' }] };

      await expect(
        verifySkippedFrameworkBuildOutput(config as unknown as AzionConfig),
      ).resolves.toEqual([]);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  it('does nothing when the config has no storage', async () => {
    await expect(verifySkippedFrameworkBuildOutput({} as AzionConfig)).resolves.toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });
});
