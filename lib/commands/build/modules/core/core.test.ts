import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { executeBuild } from './core';
import {
  BuildConfiguration,
  BuildContext,
  AzionPrebuildResult,
} from 'azion/config';

// Primeiro, declaramos variáveis para armazenar os mocks
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockExistsSync = jest.fn();
const mockRmSync = jest.fn();

// Depois, configuramos os mocks
jest.mock('fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
}));

jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  rmSync: mockRmSync,
}));

jest.mock('azion/bundler', () => ({
  createAzionESBuildConfig: jest.fn(),
  executeESBuildBuild: jest.fn().mockImplementation(() => Promise.resolve()),
  createAzionWebpackConfig: jest.fn(),
  executeWebpackBuild: jest.fn().mockImplementation(() => Promise.resolve()),
}));

jest.mock('./utils', () => ({
  moveImportsToTopLevel: jest.fn((code) => code),
}));

jest.mock('path', () => ({
  resolve: jest.fn((base, file) => {
    if (file && typeof file === 'string' && file.startsWith('/')) return file;
    return `/absolute/path/${file}`;
  }),
  dirname: jest.fn(() => '/absolute/path'),
  join: jest.fn((...paths) => {
    const result = paths.join('/');
    if (result.includes('.edge')) {
      return `/absolute/path/${result}`;
    }
    return result;
  }),
}));

// Mock para process.cwd para garantir caminhos consistentes
jest.spyOn(process, 'cwd').mockImplementation(() => '/absolute/path');

// Garantir que existsSync retorne true para os arquivos de teste
mockExistsSync.mockImplementation((path) => {
  if (
    typeof path === 'string' &&
    (path.includes('temp/entry.js') || path.includes('.edge'))
  ) {
    return true;
  }
  return false;
});

// Mock para fs.readFile para resolver corretamente os arquivos
mockReadFile.mockImplementation((path) => {
  if (typeof path === 'string' && path.includes('temp/entry.js')) {
    return Promise.resolve('// Original entry code');
  }
  return Promise.resolve('// Bundled code');
});

// Importamos depois de mockar
import { readFile, writeFile } from 'fs/promises';
import { rmSync } from 'fs';
import {
  createAzionESBuildConfig,
  executeESBuildBuild,
  createAzionWebpackConfig,
  executeWebpackBuild,
} from 'azion/bundler';
import { moveImportsToTopLevel } from './utils';

describe('executeBuild', () => {
  const mockBuildConfig: BuildConfiguration = {
    entry: 'temp/entry.js',
    preset: {
      metadata: { name: 'test-preset' },
      config: { build: {} },
    },
    polyfills: true,
    worker: false,
    bundler: 'esbuild',
    setup: {
      contentToInject: '',
      defineVars: {},
    },
  };

  const mockContext: BuildContext = {
    production: true,
    output: '.edge/worker.js',
    entrypoint: 'src/index.js',
  };

  const mockPrebuildResult: AzionPrebuildResult = {
    filesToInject: [],
    injection: {
      globals: {},
      entry: '',
      banner: '/* banner */',
    },
    bundler: {
      defineVars: { 'process.env.NODE_ENV': '"production"' },
      plugins: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockReadFile.mockImplementation((path) => {
      if (path === 'temp/entry.js')
        return Promise.resolve('// Original entry code');
      return Promise.resolve('// Bundled code');
    });
  });

  it('should execute build with esbuild bundler', async () => {
    await executeBuild({
      buildConfig: mockBuildConfig,
      prebuildResult: mockPrebuildResult,
      ctx: mockContext,
    });

    expect(createAzionESBuildConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        setup: {
          contentToInject: '/* banner */',
          defineVars: { 'process.env.NODE_ENV': '"production"' },
        },
      }),
      mockContext,
    );
    expect(executeESBuildBuild).toHaveBeenCalled();
    expect(writeFile).toHaveBeenCalledWith(
      mockContext.output,
      expect.stringContaining('// Bundled code'),
    );
  });

  it('should execute build with webpack bundler', async () => {
    const webpackConfig: BuildConfiguration = {
      ...mockBuildConfig,
      bundler: 'webpack',
    };

    await executeBuild({
      buildConfig: webpackConfig,
      prebuildResult: mockPrebuildResult,
      ctx: mockContext,
    });

    expect(createAzionWebpackConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        setup: {
          contentToInject: '/* banner */',
          defineVars: { 'process.env.NODE_ENV': '"production"' },
        },
      }),
      mockContext,
    );
    expect(executeWebpackBuild).toHaveBeenCalled();
  });

  it('should inject entry content when provided in prebuild result', async () => {
    const prebuildWithEntry = {
      ...mockPrebuildResult,
      injection: {
        ...mockPrebuildResult.injection,
        entry: 'public',
      },
    };

    await executeBuild({
      buildConfig: mockBuildConfig,
      prebuildResult: prebuildWithEntry,
      ctx: mockContext,
    });

    expect(readFile).toHaveBeenCalledWith(mockBuildConfig.entry, 'utf-8');
    expect(moveImportsToTopLevel).toHaveBeenCalledWith(
      'public // Original entry code',
    );
    expect(writeFile).toHaveBeenCalledWith(
      mockBuildConfig.entry,
      expect.any(String),
    );
  });

  it('should inject node:fs polyfill in production mode when polyfills is true', async () => {
    await executeBuild({
      buildConfig: mockBuildConfig,
      prebuildResult: mockPrebuildResult,
      ctx: mockContext,
    });

    expect(writeFile).toHaveBeenCalledWith(
      mockContext.output,
      expect.stringContaining('import SRC_NODE_FS from "node:fs"'),
    );
  });

  it('should not inject node:fs polyfill when polyfills is false', async () => {
    const configWithoutPolyfills = {
      ...mockBuildConfig,
      polyfills: false,
    };

    await executeBuild({
      buildConfig: configWithoutPolyfills,
      prebuildResult: mockPrebuildResult,
      ctx: mockContext,
    });

    expect(writeFile).toHaveBeenCalledWith(
      mockContext.output,
      expect.not.stringContaining('import SRC_NODE_FS from "node:fs"'),
    );
  });

  it('should throw error for unsupported bundler', async () => {
    const invalidConfig = {
      ...mockBuildConfig,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bundler: 'invalid' as any,
    };

    await expect(
      executeBuild({
        buildConfig: invalidConfig,
        prebuildResult: mockPrebuildResult,
        ctx: mockContext,
      }),
    ).rejects.toThrow('Unsupported bundler: invalid');
  });

  it('should clean up temporary files on error', async () => {
    (executeESBuildBuild as jest.Mock).mockImplementation(() => {
      throw new Error('Build error');
    });

    await expect(
      executeBuild({
        buildConfig: mockBuildConfig,
        prebuildResult: mockPrebuildResult,
        ctx: mockContext,
      }),
    ).rejects.toThrow('Build error');

    expect(rmSync).toHaveBeenCalled();
  });
});
