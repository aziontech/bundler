import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { generateManifest } from './manifest';
import { AzionConfig, processConfig } from 'azion/config';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

jest.mock('azion/config', () => ({
  processConfig: jest.fn(),
}));

describe('generateManifest', () => {
  const mockConfig: AzionConfig = {
    build: {
      entry: 'src/index.js',
      polyfills: true,
    },
  };

  const mockManifest = {
    name: 'test-app',
    version: '1.0.0',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (process.cwd as jest.Mock).mockReturnValue('/mock/project');
    (processConfig as jest.Mock).mockReturnValue(mockManifest);
    (join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });

  it('should create output directory if it does not exist', async () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    await generateManifest(mockConfig);

    expect(existsSync).toHaveBeenCalledWith('/mock/project/.edge');
    expect(mkdirSync).toHaveBeenCalledWith('/mock/project/.edge', {
      recursive: true,
    });
  });

  it('should not create output directory if it already exists', async () => {
    (existsSync as jest.Mock).mockReturnValue(true);

    await generateManifest(mockConfig);

    expect(mkdirSync).not.toHaveBeenCalled();
  });

  it('should process config and write manifest file', async () => {
    await generateManifest(mockConfig);

    expect(processConfig).toHaveBeenCalledWith(mockConfig);
    expect(writeFileSync).toHaveBeenCalledWith(
      '/mock/project/.edge/manifest.json',
      JSON.stringify(mockManifest, null, 2),
    );
  });

  it('should use custom output path when provided', async () => {
    await generateManifest(mockConfig, '/custom/path');

    expect(existsSync).toHaveBeenCalledWith('/custom/path');
    expect(writeFileSync).toHaveBeenCalledWith(
      '/custom/path/manifest.json',
      JSON.stringify(mockManifest, null, 2),
    );
  });
});
