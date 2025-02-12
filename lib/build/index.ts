import { AzionConfig } from 'azion/config';
import { createBuildConfig } from './modules/config';
import { loadPreset } from './modules/preset';
import { executeBuildPipeline } from './modules/pipeline';
import { generateManifest } from './modules/manifest';
import { feedback, debug } from '#utils';
import { BuildEnv } from 'azion/bundler';

/**
 * Main build function
 */
export const build = async (
  config: AzionConfig,
  ctx: BuildEnv,
): Promise<void> => {
  try {
    // Load preset
    const preset =
      typeof config.build?.preset === 'string'
        ? await loadPreset(config.build.preset)
        : config.build?.preset;

    if (!preset?.handler || !preset?.meta?.name) {
      throw new Error('Preset must have handler and meta.name');
    }

    // Create build config
    const buildConfig = createBuildConfig(config);

    // Execute build pipeline
    await executeBuildPipeline(buildConfig, preset, ctx);

    // Generate manifest
    await generateManifest(config);
  } catch (error: unknown) {
    debug.error(error);
    feedback.build.error((error as Error).message);
    process.exit(1);
  }
};

export default build;
