import { describe, it, expect } from '@jest/globals';
import type { AzionBuildPreset, AzionConfig } from '@aziontech/config';
import { setupBuildConfig } from './config';

const asPreset = (preset: unknown) => preset as AzionBuildPreset;

const outputOf = async (config: AzionConfig, preset: AzionBuildPreset) =>
  Object.keys((await setupBuildConfig(config, preset, true)).entry);

describe('setupBuildConfig by config version', () => {
  // the default entry (and so the generated function) differs between config versions
  const versioned = asPreset({
    metadata: { name: 'versioned' },
    config: { build: { entry: 'main.js' } },
    configs: {
      3: { version: 3, build: { entry: 'legacy.js' } },
      4: { build: { entry: 'main.js' } },
    },
  });

  it('uses the default entry of the v4 preset config when the version is not declared', async () => {
    expect(await outputOf({}, versioned)).toEqual(['.edge/functions/main']);
  });

  it('uses the default entry of the v3 preset config when the project is on v3', async () => {
    expect(await outputOf({ version: 3 as AzionConfig['version'] }, versioned)).toEqual([
      '.edge/functions/legacy',
    ]);
  });

  it('uses preset.config when the v3 config declares no entry (a prebuild set it)', async () => {
    const switched = asPreset({
      metadata: { name: 'switched' },
      config: { build: { entry: '.output/server/index.mjs' } },
      configs: { 3: { version: 3, build: {} } },
    });

    expect(await outputOf({ version: 3 as AzionConfig['version'] }, switched)).toEqual([
      '.edge/functions/index',
    ]);
  });

  it('prefers the entry of the user config', async () => {
    expect(
      await outputOf(
        { version: 3 as AzionConfig['version'], build: { entry: 'app.js' } },
        versioned,
      ),
    ).toEqual(['.edge/functions/app']);
  });
});

describe('setupBuildConfig output name', () => {
  it('generates handler.js for a preset with a built-in handler and no entry', async () => {
    const withHandler = asPreset({
      metadata: { name: 'with-handler' },
      config: { build: {} },
      handler: { fetch: async () => new Response('ok') },
    });

    expect(await outputOf({}, withHandler)).toEqual(['.edge/functions/handler']);
  });

  it('keeps the source file but names the output after the key of an object entry', async () => {
    const objectEntry = asPreset({
      metadata: { name: 'object-entry' },
      config: { build: { entry: { index: 'handler.js' } } },
    });

    const { entry } = await setupBuildConfig({}, objectEntry, true);

    expect(Object.keys(entry)).toEqual(['.edge/functions/index']);
    expect(Object.values(entry)[0]).toContain('handler');
  });
});
