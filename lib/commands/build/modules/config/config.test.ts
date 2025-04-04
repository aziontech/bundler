import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { setupBuildConfig } from './config';

describe('setupBuildConfig', () => {
  const mockPreset = {
    metadata: {
      name: 'test-preset',
      ext: 'ts',
    },
    config: {
      build: {
        entry: 'index.ts',
      },
    },
  };

  const mockConfig = {
    build: {
      entry: 'index.ts',
      polyfills: true,
      worker: false,
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create build configuration with correct defaults', async () => {
    const result = await setupBuildConfig(mockConfig, mockPreset);

    expect(result).toMatchObject({
      polyfills: true,
      worker: false,
      preset: mockPreset,
      setup: {
        contentToInject: undefined,
        defineVars: {},
      },
    });

    expect(result.entry).toMatchObject({
      '.edge/functions/index': expect.stringMatching(/azion-.*\.temp\.ts$/),
    });
  });

  it('should use js extension when preset.metadata.ext is not provided', async () => {
    const presetWithoutExt = {
      metadata: { name: 'test' },
      config: { build: {} },
    };
    const result = await setupBuildConfig(mockConfig, presetWithoutExt);

    expect(Object.values(result.entry)[0]).toMatch(/\.temp\.js$/);
  });
});
