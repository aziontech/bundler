/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { executePrebuild } from './prebuild';
import {
  BuildConfiguration,
  BuildContext,
  AzionPrebuildResult,
} from 'azion/config';
import utils from './utils';

describe('executePrebuild', () => {
  let spyinjectWorkerGlobals: jest.SpiedFunction<
    typeof utils.injectWorkerGlobals
  >;
  let spyinjectWorkerMemoryFiles: jest.SpiedFunction<
    typeof utils.injectWorkerMemoryFiles
  >;
  let spycopyFilesToLocalEdgeStorage: jest.SpiedFunction<
    typeof utils.copyFilesToLocalEdgeStorage
  >;

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
    (mockBuildConfig.preset.prebuild as jest.Mock).mockImplementation(() =>
      Promise.resolve(mockPrebuildResult),
    );
    spyinjectWorkerGlobals = jest
      .spyOn(utils, 'injectWorkerGlobals')
      .mockReturnValue('');
    spyinjectWorkerMemoryFiles = jest
      .spyOn(utils, 'injectWorkerMemoryFiles')
      .mockResolvedValue('');
    spycopyFilesToLocalEdgeStorage = jest
      .spyOn(utils, 'copyFilesToLocalEdgeStorage')
      .mockReturnValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    expect(utils.injectWorkerGlobals).toHaveBeenCalledWith({
      namespace: 'bundler',
      vars: { API_KEY: '"test-key"' },
    });
    expect(utils.injectWorkerMemoryFiles).toHaveBeenCalledWith({
      namespace: 'bundler',
      property: '__FILES__',
      dirs: [],
    });
    expect(utils.copyFilesToLocalEdgeStorage).toHaveBeenCalledWith({
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

    expect(utils.injectWorkerGlobals).toHaveBeenCalledWith({
      namespace: 'bundler',
      vars: { API_KEY: '"test-key"' },
    });
  });
});
