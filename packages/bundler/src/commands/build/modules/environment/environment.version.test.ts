import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  processConfig,
  validateConfig,
  type AzionBuildPreset,
  type AzionConfig,
} from '@aziontech/config';
import { react } from '@aziontech/presets';
import envDefault from '../../../../env';
import { setEnvironment } from './environment';

const ctx = { production: true, handler: 'handler.js' };

describe('setEnvironment by config version', () => {
  let spyWriteUserConfig: jest.SpiedFunction<typeof envDefault.writeUserConfig>;

  beforeEach(() => {
    spyWriteUserConfig = jest.spyOn(envDefault, 'writeUserConfig').mockResolvedValue();
    jest.spyOn(envDefault, 'readAzionConfig').mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses the v4 preset config when the config does not declare a version', async () => {
    const merged = await setEnvironment({ config: { build: {} }, preset: react, ctx });

    expect(merged.version).toBe(4);
    expect(merged).toHaveProperty('applications');
    expect(merged).not.toHaveProperty('origin');
    expect(() => validateConfig(merged)).not.toThrow();
  });

  it('uses the v3 preset config when the config declares version 3', async () => {
    const merged = await setEnvironment({
      config: { version: 3 as AzionConfig['version'], build: {} },
      preset: react,
      ctx,
    });

    expect(merged.version).toBe(3);
    expect(merged).toHaveProperty('origin');
    expect(merged).toHaveProperty('rules');
    expect(merged).not.toHaveProperty('applications');
    expect(() => validateConfig(merged)).not.toThrow();
    expect(processConfig(merged)).toHaveProperty('origin');
  });

  it('writes the generated azion.config with the version explicit', async () => {
    await setEnvironment({ config: { build: {} }, preset: react, ctx });
    await setEnvironment({
      config: { version: 3 as AzionConfig['version'], build: {} },
      preset: react,
      ctx,
    });

    expect(spyWriteUserConfig).toHaveBeenNthCalledWith(1, expect.objectContaining({ version: 4 }));
    expect(spyWriteUserConfig).toHaveBeenNthCalledWith(2, expect.objectContaining({ version: 3 }));
  });

  it.each([
    [4, ['applications', 'workloads', 'connectors', 'functions']],
    [3, ['origin', 'rules']],
  ])('drops the preset defaults of v%i when the firewall is enabled', async (version, dropped) => {
    const merged = await setEnvironment({
      config: { version: version as AzionConfig['version'], firewall: [] },
      preset: react,
      ctx,
    });

    dropped.forEach((key) => expect(merged).not.toHaveProperty(key));
  });

  it('does not change the preset when the firewall drops its defaults', async () => {
    await setEnvironment({ config: { firewall: [] }, preset: react, ctx });

    expect(react.config).toHaveProperty('applications');
    expect(react.configs?.[4]).toHaveProperty('applications');
  });

  it('keeps working with presets that only declare `config`', async () => {
    const custom: AzionBuildPreset = {
      metadata: { name: 'custom' },
      config: { build: { entry: 'src/index.ts' } },
    };

    await expect(
      setEnvironment({ config: { build: {} }, preset: custom, ctx }),
    ).resolves.toMatchObject({
      version: 4,
    });
    await expect(
      setEnvironment({
        config: { version: 3 as AzionConfig['version'], build: {} },
        preset: custom,
        ctx,
      }),
    ).rejects.toThrow('does not support config version 3');
  });
});
