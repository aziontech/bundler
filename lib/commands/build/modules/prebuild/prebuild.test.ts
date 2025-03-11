import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { executePrebuild } from './prebuild';
import {
  BuildConfiguration,
  BuildContext,
  AzionPrebuildResult,
} from 'azion/config';
import {
  injectWorkerGlobals,
  injectWorkerMemoryFiles,
  copyFilesToLocalEdgeStorage,
  injectWorkerPathPrefix,
} from './utils';

// Mock dependencies
jest.mock('./utils', () => ({
  injectWorkerGlobals: jest.fn().mockReturnValue('globalThis.bundler={}'),
  injectWorkerMemoryFiles: jest
    .fn()
    .mockImplementation(() =>
      Promise.resolve('globalThis.bundler.__FILES__={}'),
    ),
  copyFilesToLocalEdgeStorage: jest.fn(),
  injectWorkerPathPrefix: jest
    .fn()
    .mockImplementation(() =>
      Promise.resolve(
        'globalThis.bundler = {}; globalThis.bundler.FS_PATH_PREFIX_TO_REMOVE = "";',
      ),
    ),
}));

describe('executePrebuild', () => {
  const mockBuildConfig: BuildConfiguration = {
    entry: 'src/index.js',
    preset: {
      metadata: { name: 'test-preset' },
      config: { build: {} },
      prebuild: jest.fn() as (
        config: BuildConfiguration,
        ctx: BuildContext,
      ) => Promise<AzionPrebuildResult>,
    },
    polyfills: true,
    worker: false,
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
    filesToInject: ['public'],
    injection: {
      globals: { API_KEY: '"test-key"' },
      entry: 'public',
      banner: '',
    },
    bundler: {
      defineVars: { 'process.env.NODE_ENV': '"production"' },
      plugins: [],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (mockBuildConfig.preset.prebuild as jest.Mock).mockImplementation(() =>
      Promise.resolve(mockPrebuildResult),
    );
  });

  it('should execute preset prebuild function and process result', async () => {
    const result = await executePrebuild({
      buildConfig: mockBuildConfig,
      ctx: mockContext,
    });

    expect(mockBuildConfig.preset.prebuild).toHaveBeenCalledWith(
      mockBuildConfig,
      mockContext,
    );
    expect(injectWorkerGlobals).toHaveBeenCalledWith({
      namespace: 'bundler',
      vars: { API_KEY: '"test-key"' },
    });
    expect(injectWorkerMemoryFiles).toHaveBeenCalledWith({
      namespace: 'bundler',
      property: '__FILES__',
      dirs: [],
    });
    expect(copyFilesToLocalEdgeStorage).toHaveBeenCalledWith({
      dirs: ['public'],
      prefix: '',
      outputPath: '.edge/files',
    });
    expect(result).toEqual(
      expect.objectContaining({
        filesToInject: ['public'],
        injection: expect.objectContaining({
          globals: { API_KEY: '"test-key"' },
        }),
        bundler: expect.objectContaining({
          defineVars: { 'process.env.NODE_ENV': '"production"' },
        }),
      }),
    );
  });

  it('should use default result when preset has no prebuild function', async () => {
    const configWithoutPrebuild = {
      ...mockBuildConfig,
      preset: {
        metadata: { name: 'test-preset' },
        config: { build: {} },
      },
    };

    const result = await executePrebuild({
      buildConfig: configWithoutPrebuild,
      ctx: mockContext,
    });

    expect(result).toEqual(
      expect.objectContaining({
        filesToInject: [],
        injection: expect.objectContaining({
          globals: {},
        }),
        bundler: expect.objectContaining({
          defineVars: {},
          plugins: [],
        }),
      }),
    );
  });

  it('should filter out undefined values from globals and defineVars', async () => {
    (mockBuildConfig.preset.prebuild as jest.Mock).mockImplementation(() => ({
      injection: {
        globals: { API_KEY: '"test-key"', DEBUG: undefined },
      },
      bundler: {
        defineVars: {
          'process.env.NODE_ENV': '"production"',
          DEBUG: undefined,
        },
      },
    }));

    await executePrebuild({
      buildConfig: mockBuildConfig,
      ctx: mockContext,
    });

    expect(injectWorkerGlobals).toHaveBeenCalledWith({
      namespace: 'bundler',
      vars: { API_KEY: '"test-key"' },
    });
  });
});
