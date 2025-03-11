import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { BundlerStore } from '#env';
import { mergeConfigWithUserOverrides } from './utils';
// Adicionar mock do fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(() => Promise.resolve()),
  writeFile: jest.fn(() => Promise.resolve()),
}));

globalThis.bundler = {
  tempPath: './test/mock/temp/path',
} as any;

// Mock das dependências
jest.mock('lib/env/runtime', () => ({}), { virtual: true });
jest.mock('lib/env/server', () => ({}), { virtual: true });
jest.mock('./runtime', () => ({}), { virtual: true });

// Mock das funções do #env
const mockStore: { userConfig?: any } = {};
const readUserConfigMock = jest.fn<() => Promise<any>>();
const writeUserConfigMock = jest.fn<(config: AzionConfig) => Promise<void>>();
const writeStoreMock = jest.fn<(data: BundlerStore) => Promise<void>>();
const mergeConfigWithUserOverridesMock =
  jest.fn<typeof mergeConfigWithUserOverrides>();

jest.mock('#env', () => ({
  writeStore: writeStoreMock,
  writeUserConfig: writeUserConfigMock,
  readUserConfig: readUserConfigMock,
}));

jest.mock('./utils', () => ({
  mergeConfigWithUserOverrides: mergeConfigWithUserOverridesMock,
}));

import { setEnvironment } from './environment';
import { AzionConfig, AzionBuildPreset, BuildContext } from 'azion/config';

describe('setEnvironment', () => {
  const mockPreset: AzionBuildPreset = {
    metadata: {
      name: 'test-preset',
      ext: 'ts',
    },
    config: {
      build: {
        entry: 'src/index.ts',
      },
    },
  };

  const mockConfig: AzionConfig = {
    build: {
      polyfills: true,
      worker: false,
    },
  };

  const mockContext: BuildContext = {
    production: true,
    output: '.edge/worker.js',
    entrypoint: 'src/index.ts',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStore.userConfig = undefined;
    readUserConfigMock.mockResolvedValue({});
    mergeConfigWithUserOverridesMock.mockReturnValue({
      build: {
        polyfills: true,
        worker: false,
        entry: 'src/index.ts',
      },
    });
  });

  it('should create initial configuration when user config does not exist', async () => {
    await setEnvironment({
      config: mockConfig,
      preset: mockPreset,
      ctx: mockContext,
    });

    expect(mergeConfigWithUserOverridesMock).toHaveBeenCalledWith(
      mockPreset.config,
      mockConfig,
    );
    expect(writeUserConfigMock).toHaveBeenCalled();
    expect(writeStoreMock).toHaveBeenCalled();
  });

  it('should not create configuration when user config already exists', async () => {
    await setEnvironment({
      config: mockConfig,
      preset: mockPreset,
      ctx: mockContext,
    });

    expect(mergeConfigWithUserOverridesMock).toHaveBeenCalledWith(
      mockPreset.config,
      mockConfig,
    );
    expect(writeUserConfigMock).not.toHaveBeenCalled();
    expect(writeStoreMock).toHaveBeenCalled();
  });

  it('should add preset name to configuration when not defined', async () => {
    mergeConfigWithUserOverridesMock.mockReturnValue({
      build: {
        polyfills: true,
        worker: false,
      },
    } as AzionConfig);

    await setEnvironment({
      config: mockConfig,
      preset: mockPreset,
      ctx: mockContext,
    });

    expect(writeUserConfigMock).toHaveBeenCalledWith(
      expect.objectContaining({
        build: expect.objectContaining({
          preset: 'test-preset',
        }),
      }),
    );
  });

  it('should throw error when environment setup fails', async () => {
    readUserConfigMock.mockRejectedValueOnce(new Error('Test error'));

    await expect(
      setEnvironment({
        config: mockConfig,
        preset: mockPreset,
        ctx: mockContext,
      }),
    ).rejects.toThrow('Failed to set environment: Test error');
  });
});
