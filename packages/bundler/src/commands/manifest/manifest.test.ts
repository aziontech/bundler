import { jest, describe, beforeEach, it, expect, afterEach } from '@jest/globals';
import { promises as fs } from 'fs';
import type { AzionConfig } from '@aziontech/config';
import { generateManifest } from './manifest';
import util from './util';
import * as utilNode from '@aziontech/utils/node';

jest.mock('fs/promises');

const mockManifest = {
  name: 'test-app',
  version: '1.0.0',
};

describe('generateManifest', () => {
  const mockConfig: AzionConfig = {
    build: {
      entry: 'src/index.js',
      polyfills: true,
    },
  };

  beforeEach(() => {
    jest.spyOn(utilNode.feedback, 'success').mockReturnValue(void 0);
    jest.spyOn(process, 'cwd').mockReturnValue('./');
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify(mockConfig));
    jest.spyOn(fs, 'access').mockRejectedValue(new Error('File not found'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create output directory if it does not exist', async () => {
    const spyAccess = jest.spyOn(fs, 'access');
    const spyMkdir = jest.spyOn(fs, 'mkdir');

    await generateManifest(mockConfig);

    expect(spyAccess).toHaveBeenCalledWith('.edge');
    expect(spyMkdir).toHaveBeenCalledWith('.edge', { recursive: true });
  });

  it('should not create output directory if it already exists', async () => {
    jest.spyOn(fs, 'access').mockResolvedValue(undefined);
    const spyMkdir = jest.spyOn(fs, 'mkdir');

    await generateManifest(mockConfig);

    expect(spyMkdir).not.toHaveBeenCalled();
  });

  it('should process config and write manifest file', async () => {
    const spyWriteFile = jest.spyOn(fs, 'writeFile');
    const spyProcessConfigWrapper = jest
      .spyOn(util, 'processConfigWrapper')
      .mockReturnValue(mockManifest);

    await generateManifest(mockConfig);

    expect(spyProcessConfigWrapper).toHaveBeenCalled();
    expect(spyWriteFile).toHaveBeenCalledWith(
      '.edge/manifest.json',
      JSON.stringify(mockManifest, null, 2),
    );
  });

  it('should use custom output path when provided', async () => {
    const spyAccess = jest.spyOn(fs, 'access');
    jest.spyOn(util, 'processConfigWrapper').mockReturnValue(mockManifest);
    const spyWriteFile = jest.spyOn(fs, 'writeFile');

    await generateManifest(mockConfig, '/custom/path');

    expect(spyAccess).toHaveBeenCalledWith('/custom/path');
    expect(spyWriteFile).toHaveBeenCalledWith(
      '/custom/path/manifest.json',
      JSON.stringify(mockManifest, null, 2),
    );
  });

  describe('config version', () => {
    const v3Config = {
      version: 3,
      origin: [{ name: 'origin-storage-default', type: 'object_storage' }],
    } as unknown as AzionConfig;

    it('should process a v3 config with the v3 strategies', async () => {
      const spyWriteFile = jest.spyOn(fs, 'writeFile');

      await generateManifest(v3Config);

      const manifest = JSON.parse(String(spyWriteFile.mock.calls[0][1]));
      expect(manifest.origin).toHaveLength(1);
      expect(manifest).not.toHaveProperty('applications');
    });

    it('should use the config version given by option when the config does not declare one', async () => {
      const spyWriteFile = jest.spyOn(fs, 'writeFile');
      const { version, ...withoutVersion } = v3Config as AzionConfig & { version: number };
      expect(version).toBe(3);

      await generateManifest(withoutVersion as AzionConfig, undefined, { configVersion: '3' });

      expect(JSON.parse(String(spyWriteFile.mock.calls[0][1]))).toHaveProperty('origin');
    });

    it('should fail when the option and the config declare different versions', async () => {
      await expect(generateManifest(v3Config, undefined, { configVersion: 4 })).rejects.toThrow(
        'Conflicting config versions',
      );
    });
  });
});
