/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import utils from './utils';
import fsPromises from 'fs/promises';

let spyReaddir: jest.SpiedFunction<typeof fsPromises.readdir>;
let spyStat: jest.SpiedFunction<typeof fsPromises.stat>;
let spyReadFile: jest.SpiedFunction<typeof fsPromises.readFile>;
let spyMkdir: jest.SpiedFunction<typeof fsPromises.mkdir>;
let spyCp: jest.SpiedFunction<typeof fsPromises.cp>;
let spyAccess: jest.SpiedFunction<typeof fsPromises.access>;

describe('injectWorkerGlobals', () => {
  it('should create globals with namespace only', () => {
    const result = utils.injectWorkerGlobals({
      namespace: 'bundler',
      vars: { API_KEY: '"test-key"', DEBUG: 'true' },
    });

    expect(result).toBe(
      'globalThis.bundler={}; globalThis.bundler.API_KEY="test-key"; globalThis.bundler.DEBUG=true;',
    );
  });

  it('should create globals with namespace and property', () => {
    const result = utils.injectWorkerGlobals({
      namespace: 'bundler',
      property: 'env',
      vars: { API_KEY: '"test-key"' },
    });

    expect(result).toBe('globalThis.bundler.env={}; globalThis.bundler.env.API_KEY="test-key";');
  });

  it('should handle empty vars', () => {
    const result = utils.injectWorkerGlobals({
      namespace: 'bundler',
      vars: {},
    });

    expect(result).toBe('globalThis.bundler={};');
  });
});

describe('injectWorkerMemoryFiles', () => {
  beforeEach(() => {
    spyReaddir = jest
      .spyOn(fsPromises, 'readdir')
      .mockImplementation(() => Promise.resolve(['file.txt', 'subdir'] as any));
    spyStat = jest.spyOn(fsPromises, 'stat').mockImplementation(() =>
      Promise.resolve({
        isDirectory: () => true,
        isFile: () => false,
      } as any),
    );
    spyReadFile = jest
      .spyOn(fsPromises, 'readFile')
      .mockImplementation(() => Promise.resolve(Buffer.from('test content')));
    spyMkdir = jest.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined);
    spyCp = jest.spyOn(fsPromises, 'cp').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should process files and directories recursively', async () => {
    spyReaddir.mockImplementation(() =>
      Promise.resolve(['file.txt', 'subdir', 'subdir/nested.txt'] as any),
    );

    spyStat.mockImplementation((path) =>
      Promise.resolve({
        isDirectory: () => path === 'subdir',
        isFile: () => path === 'public/file.txt' || path === 'public/subdir/nested.txt',
      } as any),
    );

    const result = await utils.injectWorkerMemoryFiles({
      namespace: 'bundler',
      property: '__FILES__',
      dirs: ['public'],
    });

    expect(spyReaddir).toHaveBeenCalledWith('public');
    expect(spyStat).toHaveBeenCalledWith('public/file.txt');
    expect(spyStat).toHaveBeenCalledWith('public/subdir');
    expect(spyStat).toHaveBeenCalledWith('public/subdir/nested.txt');
    expect(spyReadFile).toHaveBeenCalledWith('public/file.txt');
    expect(spyReadFile).toHaveBeenCalledWith('public/subdir/nested.txt');
    expect(result).toStrictEqual(expect.stringContaining('globalThis.bundler.__FILES__='));
  });
});

describe('copyFilesToLocalEdgeStorage', () => {
  beforeEach(() => {
    spyMkdir = jest.spyOn(fsPromises, 'mkdir').mockResolvedValue(undefined);
    spyCp = jest.spyOn(fsPromises, 'cp').mockResolvedValue(undefined);
    spyAccess = jest.spyOn(fsPromises, 'access').mockRejectedValue(new Error('File not found'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should copy files to target directory', async () => {
    await utils.copyFilesToLocalEdgeStorage({
      dirs: ['public', 'assets'],
      prefix: '',
      outputPath: '.edge/files',
    });

    expect(spyMkdir).toHaveBeenCalledWith('.edge/files/public', {
      recursive: true,
    });
    expect(spyMkdir).toHaveBeenCalledWith('.edge/files/assets', {
      recursive: true,
    });
    expect(spyCp).toHaveBeenCalledWith('public', '.edge/files/public', {
      recursive: true,
    });
    expect(spyCp).toHaveBeenCalledWith('assets', '.edge/files/assets', {
      recursive: true,
    });
  });

  it('should handle prefix replacement', async () => {
    await utils.copyFilesToLocalEdgeStorage({
      dirs: ['src/public', 'src/assets'],
      prefix: 'src/',
      outputPath: '.edge/files',
    });

    expect(spyMkdir).toHaveBeenCalledWith('.edge/files/public', {
      recursive: true,
    });
    expect(spyMkdir).toHaveBeenCalledWith('.edge/files/assets', {
      recursive: true,
    });
    expect(spyCp).toHaveBeenCalledWith('src/public', '.edge/files/public', {
      recursive: true,
    });
    expect(spyCp).toHaveBeenCalledWith('src/assets', '.edge/files/assets', {
      recursive: true,
    });
  });

  it('should not create directory if it already exists', async () => {
    spyAccess.mockResolvedValue(undefined); // Simula que o diretório existe

    await utils.copyFilesToLocalEdgeStorage({
      dirs: ['public'],
      prefix: '',
      outputPath: '.edge/files',
    });

    expect(spyMkdir).not.toHaveBeenCalled();
    expect(spyCp).toHaveBeenCalled();
  });
});

describe('injectWorkerPathPrefix', () => {
  it('should create path prefix with provided value', async () => {
    const result = await utils.injectWorkerPathPrefix({
      namespace: 'bundler',
      property: 'FS_PATH_PREFIX_TO_REMOVE',
      prefix: 'src/',
    });

    expect(result).toBe(
      "globalThis.bundler = { ...globalThis.bundler, FS_PATH_PREFIX_TO_REMOVE: 'src/'};",
    );
  });

  it('should handle empty prefix', async () => {
    const result = await utils.injectWorkerPathPrefix({
      namespace: 'bundler',
      property: 'FS_PATH_PREFIX_TO_REMOVE',
      prefix: '',
    });

    expect(result).toBe(
      'globalThis.bundler = { ...globalThis.bundler, FS_PATH_PREFIX_TO_REMOVE: \'""\'};',
    );
  });
});
