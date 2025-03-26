import { jest } from '@jest/globals';
import fs from 'fs';
import fsPromises from 'fs/promises';
import type { AzionConfig } from 'azion/config';
import { generateManifest } from './manifest';
import util from './util';
import * as utilNode from 'azion/utils/node';

jest.mock('fs');

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
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => void 0);
    jest
      .spyOn(fsPromises, 'readFile')
      .mockResolvedValue(JSON.stringify(mockConfig));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create output directory if it does not exist', async () => {
    const spyExistsSync = jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const spyMkdirSync = jest.spyOn(fs, 'mkdirSync');

    await generateManifest(mockConfig);
    expect(spyExistsSync).toHaveBeenCalledWith('.edge');
    expect(spyMkdirSync).toHaveBeenCalledWith('.edge', { recursive: true });
  });

  it('should not create output directory if it already exists', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const spyMkdirSync = jest.spyOn(fs, 'mkdirSync');

    await generateManifest(mockConfig);

    expect(spyMkdirSync).not.toHaveBeenCalled();
  });

  it('should process config and write manifest file', async () => {
    const spyWriteFileSync = jest.spyOn(fs, 'writeFileSync');
    const spyProcessConfigWrapper = jest
      .spyOn(util, 'processConfigWrapper')
      .mockReturnValue(mockManifest);

    await generateManifest(mockConfig);

    expect(spyProcessConfigWrapper).toHaveBeenCalled();
    expect(spyWriteFileSync).toHaveBeenCalledWith(
      '.edge/manifest.json',
      JSON.stringify(mockManifest, null, 2),
    );
  });

  it('should use custom output path when provided', async () => {
    const spyExistsSync = jest.spyOn(fs, 'existsSync');
    jest.spyOn(util, 'processConfigWrapper').mockReturnValue(mockManifest);
    const spyWriteFileSync = jest.spyOn(fs, 'writeFileSync');

    await generateManifest(mockConfig, '/custom/path');

    expect(spyExistsSync).toHaveBeenCalledWith('/custom/path');
    expect(spyWriteFileSync).toHaveBeenCalledWith(
      '/custom/path/manifest.json',
      JSON.stringify(mockManifest, null, 2),
    );
  });
});
