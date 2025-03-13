import { describe, it, expect, jest } from '@jest/globals';
import { setupBuildConfig } from './config';

jest.mock('#utils', () => ({
  generateTimestamp: jest.fn(() => '123456'),
}));

describe('setupBuildConfig', () => {
  const mockPreset = {
    metadata: {
      name: 'test-preset',
      ext: 'ts',
    },
    config: {
      build: {},
    },
  };

  const mockConfig = {
    build: {
      polyfills: true,
      worker: undefined,
    },
  };

  it('should create build configuration with correct defaults', () => {
    const result = setupBuildConfig(mockConfig, mockPreset);

    expect(result).toMatchObject({
      ...mockConfig.build,
      preset: mockPreset,
      polyfills: true,
      worker: false,
      setup: {
        contentToInject: undefined,
        defineVars: {},
      },
    });

    expect(result.entry).toMatch(/azion-\d+\.temp\.ts$/);
  });

  it('should use js extension when preset.metadata.ext is not provided', () => {
    const presetWithoutExt = {
      metadata: { name: 'test' },
      config: { build: {} },
    };
    const result = setupBuildConfig(mockConfig, presetWithoutExt);

    expect(result.entry).toContain('.js');
  });
});
