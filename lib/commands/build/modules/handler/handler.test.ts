import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { resolveHandlers } from './handler';
import { AzionBuildPreset, BuildContext, BuildEntryPoint } from 'azion/config';
import * as utilsNode from 'azion/utils/node';
import fsPromises from 'fs/promises';
import path from 'path';

describe('resolveHandlers', () => {
  let spyFeedbackBuildInfo: jest.SpiedFunction<
    typeof utilsNode.feedback.build.info
  >;
  let spyAccess: jest.SpiedFunction<typeof fsPromises.access>;

  const mockContext: BuildContext = {
    production: true,
    entrypoint: {
      main: 'src/index.js',
      api: 'src/api.js',
    },
  };

  const mockPreset: AzionBuildPreset = {
    metadata: {
      name: 'test-preset',
      ext: 'js',
    },
    config: {
      build: {
        entry: 'src/index.js',
      },
    },
  };

  beforeEach(() => {
    globalThis.bundler = {
      root: '/mock/root',
      package: {},
      debug: false,
      version: '1.0.0',
      tempPath: '/mock/temp',
      argsPath: '/mock/args',
    };
    spyFeedbackBuildInfo = jest
      .spyOn(utilsNode.feedback.build, 'info')
      .mockReturnValue(undefined);
    spyAccess = jest
      .spyOn(fsPromises, 'access')
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should use context entrypoint when available', async () => {
    const result = await resolveHandlers({
      ctx: mockContext,
      preset: mockPreset,
    });

    expect(result).toEqual([
      path.resolve('src/index.js'),
      path.resolve('src/api.js'),
    ]);
    expect(spyFeedbackBuildInfo).toHaveBeenCalledWith(
      expect.stringContaining('Using entry point(s):'),
    );
  });

  it('should resolve entrypoint from preset when context entrypoint is not available', async () => {
    const contextWithoutEntrypoint = {
      ...mockContext,
      entrypoint: {} as BuildEntryPoint,
    };

    const presetWithHandler = {
      ...mockPreset,
      handler: async () => new Response('ok'),
      metadata: {
        name: 'test-preset',
        ext: 'js',
      },
    };

    const result = await resolveHandlers({
      ctx: contextWithoutEntrypoint,
      preset: presetWithHandler,
    });

    expect(result).toEqual([
      path.resolve(
        '/mock/root/node_modules/azion/packages/presets/dist/presets/test-preset/handler.js',
      ),
    ]);
    expect(spyFeedbackBuildInfo).toHaveBeenCalledWith(
      expect.stringContaining('Using built-in handler'),
    );
  });

  it('should throw error when entrypoint file does not exist', async () => {
    spyAccess.mockImplementationOnce(() =>
      Promise.reject(new Error('File not found')),
    );

    await expect(
      resolveHandlers({
        ctx: mockContext,
        preset: mockPreset,
      }),
    ).rejects.toThrow('Entry point');
  });
});
