import { describe, it, expect } from '@jest/globals';
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

  it('should create build configuration with correct defaults', () => {
    const result = setupBuildConfig(mockConfig, mockPreset);

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

  it('should use js extension when preset.metadata.ext is not provided', () => {
    const presetWithoutExt = {
      metadata: { name: 'test' },
      config: { build: {} },
    };
    const result = setupBuildConfig(mockConfig, presetWithoutExt);

    expect(Object.values(result.entry)[0]).toMatch(/\.temp\.js$/);
  });
});
