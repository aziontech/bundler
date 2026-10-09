import {
  resolvePresetConfig,
  type ApiVersion,
  type AzionBuildPreset,
  type BuildEntryPoint,
} from '@aziontech/config';

export interface PresetBuild {
  entry?: BuildEntryPoint;
  bundler?: 'webpack' | 'esbuild';
}

/**
 * The default `entry` and `bundler` of a preset for the version of the project.
 *
 * The config of the version wins (an entry may differ between versions, e.g. the v3 javascript preset expects
 * `handler.js`); what it does not declare comes from `preset.config`. That fallback also covers the prebuilds that
 * change `preset.config.build.entry` once they know how the project is built (nuxt, svelte).
 */
export const resolvePresetBuild = (preset: AzionBuildPreset, version?: ApiVersion): PresetBuild => {
  const versioned = resolvePresetConfig(preset, version).build;
  const base = preset.config.build;

  return {
    entry: versioned?.entry ?? base?.entry,
    bundler: versioned?.bundler ?? base?.bundler,
  };
};
