import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { resolveEntrypoint } from './entrypoint';
import { AzionBuildPreset, BuildContext } from 'azion/config';
import * as utilsNode from 'azion/utils/node';
import fsPromises from 'fs/promises';
import path from 'path';

describe('resolveEntrypoint', () => {
  let spyFeedbackBuildInfo: jest.SpiedFunction<
    typeof utilsNode.feedback.build.info
  >;
  let spyAccess: jest.SpiedFunction<typeof fsPromises.access>;

  const mockContext: BuildContext = {
    production: true,
    output: '.edge/worker.js',
    entrypoint: 'src/index.js',
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
    // Mock for globalThis.bundler
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
    const result = await resolveEntrypoint({
      ctx: mockContext,
      preset: mockPreset,
    });

    expect(result).toBe(mockContext.entrypoint);
    expect(spyFeedbackBuildInfo).toHaveBeenCalledWith(
      expect.stringContaining('Using src/index.js as entry point.'),
    );
  });

  it('should resolve entrypoint from preset when context entrypoint is not available', async () => {
    const spyPath = jest.spyOn(path, 'resolve');

    const contextWithoutEntrypoint = { ...mockContext, entrypoint: '' };

    await resolveEntrypoint({
      ctx: contextWithoutEntrypoint,
      preset: mockPreset,
    });

    expect(spyPath).toHaveBeenCalledWith('src/index.js');
    expect(spyFeedbackBuildInfo).toHaveBeenCalledWith(
      expect.stringContaining('Using preset default entry: src/index.js'),
    );
  });

  it('should throw error when entrypoint file does not exist', async () => {
    spyAccess.mockImplementationOnce(() =>
      Promise.reject(new Error('File not found')),
    );

    await expect(
      resolveEntrypoint({
        ctx: mockContext,
        preset: mockPreset,
      }),
    ).rejects.toThrow(
      'Entry point "src/index.js" was not found. Please verify the path and try again.',
    );
  });
});
