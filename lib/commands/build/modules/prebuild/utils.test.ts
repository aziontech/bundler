import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  injectWorkerGlobals,
  injectWorkerMemoryFiles,
  copyFilesToLocalEdgeStorage,
  injectWorkerPathPrefix,
} from './utils';
import { cpSync, existsSync, mkdirSync } from 'fs';
import { readdir, stat, readFile } from 'fs/promises';

// Mock dependencies
jest.mock('fs', () => ({
  cpSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
}));

describe('injectWorkerGlobals', () => {
  it('should create globals with namespace only', () => {
    const result = injectWorkerGlobals({
      namespace: 'bundler',
      vars: { API_KEY: '"test-key"', DEBUG: 'true' },
    });

    expect(result).toBe(
      'globalThis.bundler={}; globalThis.bundler.API_KEY="test-key"; globalThis.bundler.DEBUG=true;',
    );
  });

  it('should create globals with namespace and property', () => {
    const result = injectWorkerGlobals({
      namespace: 'bundler',
      property: 'env',
      vars: { API_KEY: '"test-key"' },
    });

    expect(result).toBe(
      'globalThis.bundler.env={}; globalThis.bundler.env.API_KEY="test-key";',
    );
  });

  it('should handle empty vars', () => {
    const result = injectWorkerGlobals({
      namespace: 'bundler',
      vars: {},
    });

    expect(result).toBe('globalThis.bundler={};');
  });
});

describe('injectWorkerMemoryFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (readdir as jest.Mock).mockImplementation(() =>
      Promise.resolve(['file.txt', 'subdir']),
    );
    (stat as jest.Mock).mockImplementation((path) => {
      if ((path as string).includes('subdir')) {
        return Promise.resolve({
          isDirectory: () => true,
          isFile: () => false,
        });
      }
      return Promise.resolve({ isDirectory: () => false, isFile: () => true });
    });
    (readFile as jest.Mock).mockImplementation(() =>
      Promise.resolve(Buffer.from('test content')),
    );
  });

  it('should process files and directories recursively', async () => {
    (readdir as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve(['file.txt', 'subdir']))
      .mockImplementationOnce(() => Promise.resolve(['nested.txt']));

    const result = await injectWorkerMemoryFiles({
      namespace: 'bundler',
      property: '__FILES__',
      dirs: ['public'],
    });

    expect(readdir).toHaveBeenCalledWith('public');
    expect(readdir).toHaveBeenCalledWith('public/subdir');
    expect(readFile).toHaveBeenCalledWith('public/file.txt');
    expect(readFile).toHaveBeenCalledWith('public/subdir/nested.txt');
    expect(result).toContain('globalThis.bundler.__FILES__=');
    expect(result).toContain('/public/file.txt');
    expect(result).toContain('/public/subdir/nested.txt');
  });
});

describe('copyFilesToLocalEdgeStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (existsSync as jest.Mock).mockReturnValue(false);
  });

  it('should copy files to target directory', () => {
    copyFilesToLocalEdgeStorage({
      dirs: ['public', 'assets'],
      prefix: '',
      outputPath: '.edge/files',
    });

    expect(mkdirSync).toHaveBeenCalledWith('.edge/files/public', {
      recursive: true,
    });
    expect(mkdirSync).toHaveBeenCalledWith('.edge/files/assets', {
      recursive: true,
    });
    expect(cpSync).toHaveBeenCalledWith('public', '.edge/files/public', {
      recursive: true,
    });
    expect(cpSync).toHaveBeenCalledWith('assets', '.edge/files/assets', {
      recursive: true,
    });
  });

  it('should handle prefix replacement', () => {
    copyFilesToLocalEdgeStorage({
      dirs: ['src/public', 'src/assets'],
      prefix: 'src/',
      outputPath: '.edge/files',
    });

    expect(mkdirSync).toHaveBeenCalledWith('.edge/files/public', {
      recursive: true,
    });
    expect(mkdirSync).toHaveBeenCalledWith('.edge/files/assets', {
      recursive: true,
    });
    expect(cpSync).toHaveBeenCalledWith('src/public', '.edge/files/public', {
      recursive: true,
    });
    expect(cpSync).toHaveBeenCalledWith('src/assets', '.edge/files/assets', {
      recursive: true,
    });
  });

  it('should not create directory if it already exists', () => {
    (existsSync as jest.Mock).mockReturnValue(true);

    copyFilesToLocalEdgeStorage({
      dirs: ['public'],
      prefix: '',
      outputPath: '.edge/files',
    });

    expect(mkdirSync).not.toHaveBeenCalled();
    expect(cpSync).toHaveBeenCalled();
  });
});

describe('injectWorkerPathPrefix', () => {
  it('should create path prefix with provided value', async () => {
    const result = await injectWorkerPathPrefix({
      namespace: 'bundler',
      property: 'FS_PATH_PREFIX_TO_REMOVE',
      prefix: 'src/',
    });

    expect(result).toBe(
      "globalThis.bundler = {}; globalThis.bundler.FS_PATH_PREFIX_TO_REMOVE = 'src/';",
    );
  });

  it('should handle empty prefix', async () => {
    const result = await injectWorkerPathPrefix({
      namespace: 'bundler',
      property: 'FS_PATH_PREFIX_TO_REMOVE',
      prefix: '',
    });

    expect(result).toBe(
      "globalThis.bundler = {}; globalThis.bundler.FS_PATH_PREFIX_TO_REMOVE = '';",
    );
  });
});
