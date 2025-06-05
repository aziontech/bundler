import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import envDefault from '#env';
import utilsDefault from './utils';

import { setEnvironment } from './environment';
import { AzionConfig, AzionBuildPreset, BuildContext } from 'azion/config';

describe('setEnvironment', () => {
  let spyMergeConfigWithUserOverrides: jest.SpiedFunction<
    typeof utilsDefault.mergeConfigWithUserOverrides
  >;
  let spywriteUserConfig: jest.SpiedFunction<typeof envDefault.writeUserConfig>;

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
      entry: 'src/index.ts',
      polyfills: true,
      worker: false,
    },
  };

  const mockContext: BuildContext = {
    production: true,
    handler: 'handler.js',
  };

  beforeEach(() => {
    globalThis.bundler = {
      tempPath: '/tmp/azion',
      experimental: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    spywriteUserConfig = jest.spyOn(envDefault, 'writeUserConfig').mockResolvedValue();
    spyMergeConfigWithUserOverrides = jest
      .spyOn(utilsDefault, 'mergeConfigWithUserOverrides')
      .mockReturnValue({
        build: {
          polyfills: true,
          worker: false,
          entry: 'src/index.ts',
        },
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    // Clean up globalThis.bundler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.bundler = {} as any;
  });

  it('should create initial configuration when user config does not exist', async () => {
    jest.spyOn(envDefault, 'readAzionConfig').mockResolvedValueOnce(null);

    await setEnvironment({
      config: mockConfig,
      preset: mockPreset,
      ctx: mockContext,
    });

    expect(spyMergeConfigWithUserOverrides).toHaveBeenCalledWith(mockPreset.config, mockConfig);
    expect(spywriteUserConfig).toHaveBeenCalled();
  });

  it('should not create configuration when user config already exists', async () => {
    jest.spyOn(envDefault, 'readAzionConfig').mockResolvedValueOnce({});

    await setEnvironment({
      config: mockConfig,
      preset: mockPreset,
      ctx: mockContext,
    });

    expect(spyMergeConfigWithUserOverrides).toHaveBeenCalledWith(mockPreset.config, mockConfig);
    expect(spywriteUserConfig).not.toHaveBeenCalled();
  });

  it('should add preset name to configuration when not defined', async () => {
    jest.spyOn(envDefault, 'readAzionConfig').mockResolvedValueOnce(null);
    spyMergeConfigWithUserOverrides.mockReturnValue({
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

    expect(spywriteUserConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        build: expect.objectContaining({
          preset: 'test-preset',
        }),
      }),
    );
  });

  it('should throw error when environment setup fails', async () => {
    jest.spyOn(envDefault, 'readAzionConfig').mockRejectedValueOnce(new Error('Test error'));
    await expect(
      setEnvironment({
        config: mockConfig,
        preset: mockPreset,
        ctx: mockContext,
      }),
    ).rejects.toThrow('Failed to set environment: Test error');
  });
});
