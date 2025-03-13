import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { resolveEntrypoint } from './entrypoint';
import { AzionBuildPreset, BuildContext } from 'azion/config';
import { feedback } from 'azion/utils/node';
import { access } from 'fs/promises';
import { resolve } from 'path';

// Mock dependencies
jest.mock('fs/promises', () => ({
  access: jest.fn(),
}));

jest.mock('azion/utils/node', () => ({
  feedback: {
    build: {
      info: jest.fn(),
    },
  },
}));

jest.mock('path', () => ({
  resolve: jest.fn((...args) => args.join('/')),
}));

jest.mock('#utils', () => ({
  debug: {
    error: jest.fn(),
  },
}));

describe('resolveEntrypoint', () => {
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
    jest.clearAllMocks();
    (access as jest.Mock).mockImplementation(() => Promise.resolve(undefined));

    // Mock for globalThis.bundler
    globalThis.bundler = {
      root: '/mock/root',
      package: {},
      debug: false,
      version: '1.0.0',
      tempPath: '/mock/temp',
      argsPath: '/mock/args',
    };
  });

  it('should use context entrypoint when available', async () => {
    const result = await resolveEntrypoint({
      ctx: mockContext,
      preset: mockPreset,
    });

    expect(result).toBe(mockContext.entrypoint);
    expect(feedback.build.info).toHaveBeenCalledWith(
      expect.stringContaining('Using entrypoint'),
    );
  });

  it('should resolve entrypoint from preset when context entrypoint is not available', async () => {
    const contextWithoutEntrypoint = { ...mockContext, entrypoint: '' };

    await resolveEntrypoint({
      ctx: contextWithoutEntrypoint,
      preset: mockPreset,
    });

    expect(resolve).toHaveBeenCalledWith(
      '/mock/root',
      mockPreset.config.build!.entry,
    );
    expect(feedback.build.info).toHaveBeenCalledWith(
      expect.stringContaining('Using preset entrypoint'),
    );
  });

  it('should throw error when entrypoint file does not exist', async () => {
    (access as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error('File not found')),
    );

    await expect(
      resolveEntrypoint({
        ctx: mockContext,
        preset: mockPreset,
      }),
    ).rejects.toThrow('Entrypoint file not found');
  });
});
