import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { executePostbuild } from './postbuild';
import { BuildConfiguration, BuildContext } from 'azion/config';

describe('executePostbuild', () => {
  const mockContext: BuildContext = {
    production: true,
    handler: 'handler.js',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute preset postbuild function when available', async () => {
    const mockPostbuild = jest.fn().mockImplementation(() => Promise.resolve()) as jest.Mock;
    const mockBuildConfig: BuildConfiguration = {
      entry: { 'handler.js': 'src/index.js' },
      preset: {
        metadata: { name: 'test-preset' },
        config: { build: {} },
        postbuild: mockPostbuild as (
          config: BuildConfiguration,
          ctx: BuildContext,
        ) => Promise<void>,
      },
      polyfills: true,
      worker: false,
      setup: {
        contentToInject: '',
        defineVars: {},
      },
    };

    await executePostbuild({
      buildConfig: mockBuildConfig,
      ctx: mockContext,
    });

    expect(mockPostbuild).toHaveBeenCalledWith(mockBuildConfig, mockContext);
  });

  it('should do nothing when preset has no postbuild function', async () => {
    const mockBuildConfig: BuildConfiguration = {
      entry: { 'handler.js': 'src/index.js' },
      preset: {
        metadata: { name: 'test-preset' },
        config: { build: {} },
      },
      polyfills: true,
      worker: false,
      setup: {
        contentToInject: '',
        defineVars: {},
      },
    };

    // This should not throw an error
    await executePostbuild({
      buildConfig: mockBuildConfig,
      ctx: mockContext,
    });
  });
});
