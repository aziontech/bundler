import { describe, it, expect } from '@jest/globals';
import type { AzionBuildPreset, AzionConfig } from '@aziontech/config';
import { setupBuildConfig } from './config';

const asPreset = (preset: unknown) => preset as AzionBuildPreset;

const outputOf = async (config: AzionConfig, preset: AzionBuildPreset) =>
  Object.keys((await setupBuildConfig(config, preset, true)).entry);

describe('setupBuildConfig output name', () => {
  it('generates index.js for a preset with a built-in handler and no entry', async () => {
    const withHandler = asPreset({
      metadata: { name: 'with-handler' },
      config: { build: {} },
      handler: { fetch: async () => new Response('ok') },
    });

    expect(await outputOf({}, withHandler)).toEqual(['.edge/functions/index']);
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
