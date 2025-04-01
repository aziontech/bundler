import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import envDefault from '#env';
import utilsDefault from './utils';

import { setEnvironment } from './environment';
import { AzionConfig, AzionBuildPreset, BuildContext } from 'azion/config';

describe('setEnvironment', () => {
  let spyMergeConfigWithUserOverrides: jest.SpiedFunction<
    typeof utilsDefault.mergeConfigWithUserOverrides
  >;
  let spyWriteUserConfig: jest.SpiedFunction<typeof envDefault.writeUserConfig>;
  let spyWriteStore: jest.SpiedFunction<typeof envDefault.writeStore>;

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
  };

  beforeEach(() => {
    spyWriteUserConfig = jest.spyOn(envDefault, 'writeUserConfig').mockResolvedValue();
    spyWriteStore = jest.spyOn(envDefault, 'writeStore').mockResolvedValue();
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
  });

  it('should create initial configuration when user config does not exist', async () => {
    jest.spyOn(envDefault, 'readUserConfig').mockResolvedValueOnce(false);

    await setEnvironment({
      config: mockConfig,
      preset: mockPreset,
      ctx: mockContext,
    });

    expect(spyMergeConfigWithUserOverrides).toHaveBeenCalledWith(mockPreset.config, mockConfig);
    expect(spyWriteUserConfig).toHaveBeenCalled();
    expect(spyWriteStore).toHaveBeenCalled();
  });

  it('should not create configuration when user config already exists', async () => {
    jest.spyOn(envDefault, 'readUserConfig').mockResolvedValueOnce(true);

    await setEnvironment({
      config: mockConfig,
      preset: mockPreset,
      ctx: mockContext,
    });

    expect(spyMergeConfigWithUserOverrides).toHaveBeenCalledWith(mockPreset.config, mockConfig);
    expect(spyWriteUserConfig).not.toHaveBeenCalled();
    expect(spyWriteStore).toHaveBeenCalled();
  });

  it('should add preset name to configuration when not defined', async () => {
    jest.spyOn(envDefault, 'readUserConfig').mockResolvedValueOnce(false);
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

    expect(spyWriteUserConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        build: expect.objectContaining({
          preset: 'test-preset',
        }),
      }),
    );
  });

  it('should throw error when environment setup fails', async () => {
    jest.spyOn(envDefault, 'readUserConfig').mockRejectedValueOnce(new Error('Test error'));
    await expect(
      setEnvironment({
        config: mockConfig,
        preset: mockPreset,
        ctx: mockContext,
      }),
    ).rejects.toThrow('Failed to set environment: Test error');
  });
});
