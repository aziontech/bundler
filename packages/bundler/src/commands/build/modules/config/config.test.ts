import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { setupBuildConfig } from './config';
import * as tmp from 'tmp';
import * as fs from 'fs';
import * as path from 'path';

describe('setupBuildConfig', () => {
  let tmpDir: tmp.DirResult;
  let tmpEntryFile: string;

  const mockPreset = {
    metadata: {
      name: 'test-preset',
      ext: 'ts',
    },
    config: {
      build: {
        entry: 'index.ts',
      },
    },
  };

  const isProduction = true;

  beforeEach(() => {
    // Criar diretório temporário
    tmpDir = tmp.dirSync({ unsafeCleanup: true });

    tmpEntryFile = path.join(tmpDir.name, 'index.ts');
    fs.writeFileSync(tmpEntryFile, 'console.log("Hello, world!");');

    mockConfig.build.entry = tmpEntryFile;

    globalThis.bundler = {
      root: tmpDir.name,
      package: {},
      debug: false,
      version: '1.0.0',
      tempPath: path.join(tmpDir.name, 'temp'),
      argsPath: path.join(tmpDir.name, 'args'),
      experimental: true,
    };
  });

  afterEach(() => {
    // Limpar diretório temporário
    tmpDir.removeCallback();
    jest.clearAllMocks();
  });

  const mockConfig = {
    build: {
      entry: '', // Será definido no beforeEach com o caminho do arquivo temporário
      polyfills: true,
      worker: false,
    },
  };

  it('should create build configuration with correct defaults', async () => {
    const result = await setupBuildConfig(mockConfig, mockPreset, isProduction);

    expect(result).toMatchObject({
      polyfills: true,
      worker: false,
      preset: mockPreset,
      setup: {
        contentToInject: undefined,
        defineVars: {},
      },
    });

    expect(Object.keys(result.entry)[0]).toMatch(/\.edge\/functions\/index/);
    expect(Object.values(result.entry)[0]).toMatch(/azion-.*\.temp\.ts$/);
  });

  it('should use js extension when preset.metadata.ext is not provided', async () => {
    const presetWithoutExt = {
      metadata: { name: 'test' },
      config: { build: {} },
    };

    const tmpJsFile = path.join(tmpDir.name, 'index.js');
    fs.writeFileSync(tmpJsFile, 'console.log("Hello from JS");');
    mockConfig.build.entry = tmpJsFile;

    const result = await setupBuildConfig(mockConfig, presetWithoutExt, isProduction);

    expect(Object.values(result.entry)[0]).toMatch(/\.temp\.js$/);
  });
});
