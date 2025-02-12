import { AzionConfig } from 'azion/config';
import { existsSync, rmSync, writeFileSync } from 'fs';

/* build modules */
import { createBuildConfig } from './modules/config';
import { generateManifest } from './modules/manifest';
import { executeBuildPipeline } from './modules/pipeline';
import { loadPreset } from './modules/preset';
/**
 * Main build dispatcher function
 */
export const executeBuild = async (config: AzionConfig): Promise<void> => {
  let buildEntryTemp: string | undefined;

  try {
    const presetFiles =
      typeof config.build?.preset === 'string' ? await loadPreset(config.build.preset) : config.build?.preset;

    if (!presetFiles?.handler || !presetFiles?.meta?.name) {
      throw new Error('Preset must have handler and meta.name');
    }

    const buildConfig = createBuildConfig(config, presetFiles);
    buildEntryTemp = buildConfig.entry;

    writeFileSync(buildConfig.entry, presetFiles.handler);
    await executeBuildPipeline(buildConfig, presetFiles);

    if (buildEntryTemp && existsSync(buildEntryTemp)) {
      rmSync(buildEntryTemp);
    }

    await generateManifest(config);
  } catch (error: unknown) {
    if (buildEntryTemp && existsSync(buildEntryTemp)) {
      rmSync(buildEntryTemp);
    }
    throw error;
  }
};

export default executeBuild;
