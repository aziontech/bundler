import { describe, it, expect } from '@jest/globals';
import type { AzionBuildPreset } from '@aziontech/config';
import { resolvePresetBuild } from './preset-build';

const preset = (config: unknown, configs?: unknown) =>
  ({ metadata: { name: 'demo' }, config, configs }) as unknown as AzionBuildPreset;

describe('resolvePresetBuild', () => {
  const versioned = preset(
    { build: { entry: 'index.js', bundler: 'esbuild' } },
    {
      3: { version: 3, build: { entry: 'handler.js', bundler: 'esbuild' } },
      4: { build: { entry: 'index.js', bundler: 'esbuild' } },
    },
  );

  it('uses the default version when none is given', () => {
    expect(resolvePresetBuild(versioned)).toEqual({ entry: 'index.js', bundler: 'esbuild' });
  });

  it('uses the entry of the config of the version', () => {
    expect(resolvePresetBuild(versioned, 3).entry).toBe('handler.js');
    expect(resolvePresetBuild(versioned, 4).entry).toBe('index.js');
  });

  it('falls back to preset.config for what the version does not declare', () => {
    // nuxt and svelte: the prebuild sets the entry on preset.config only
    const switched = preset(
      { build: { entry: '.output/server/index.mjs', bundler: 'esbuild' } },
      { 3: { version: 3, build: { bundler: 'esbuild' } }, 4: undefined },
    );

    expect(resolvePresetBuild(switched, 3).entry).toBe('.output/server/index.mjs');
  });

  it('works with a preset that only declares config', () => {
    expect(resolvePresetBuild(preset({ build: { entry: 'main.js' } }))).toEqual({
      entry: 'main.js',
      bundler: undefined,
    });
  });

  it('fails for a version the preset does not support', () => {
    expect(() => resolvePresetBuild(preset({ build: {} }), 3)).toThrow(
      'does not support config version 3',
    );
  });
});
