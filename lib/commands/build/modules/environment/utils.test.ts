import { describe, it, expect } from '@jest/globals';
import { mergeConfigWithUserOverrides } from './utils';
import { AzionConfig } from 'azion/config';

describe('mergeConfigWithUserOverrides', () => {
  it('should merge base config with user config', () => {
    const baseConfig: AzionConfig = {
      build: {
        entry: 'src/index.js',
      },
    };

    const userConfig: AzionConfig = {
      build: {
        polyfills: false,
        worker: true,
      },
    };

    const result = mergeConfigWithUserOverrides(baseConfig, userConfig);

    expect(result).toEqual({
      build: {
        polyfills: false,
        worker: true,
      },
    });
  });

  it('should prioritize user configurations', () => {
    const baseConfig: AzionConfig = {
      build: {
        entry: 'src/index.js',
        polyfills: false,
      },
    };

    const userConfig: AzionConfig = {
      build: {
        entry: 'src/main.js',
      },
    };

    const result = mergeConfigWithUserOverrides(baseConfig, userConfig);

    expect(result).toEqual({
      build: {
        entry: 'src/main.js',
      },
    });
  });

  it('should handle empty user config', () => {
    const baseConfig: AzionConfig = {
      build: {
        entry: 'src/index.js',
        polyfills: true,
      },
    };

    const result = mergeConfigWithUserOverrides(baseConfig, null);

    expect(result).toEqual(baseConfig);
  });
});
