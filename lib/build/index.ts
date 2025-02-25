import {
  AzionBuildPreset,
  AzionPrebuildResult,
  AzionConfig,
  BuildContext,
  PresetInput,
} from 'azion/config';
import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
/* Modules */
import { setupBuildConfig } from './modules/config';
import { resolvePreset } from './modules/preset';
import { executePrebuild } from './modules/prebuild';
import { executeBuild } from './modules/core';
import { executePostbuild } from './modules/postbuild';
import { generateManifest } from './modules/manifest';
import { checkDependenciesInstallation } from './utils';
import { setEnvironment } from './modules/environment';

interface BuildParams {
  config: AzionConfig;
  ctx: BuildContext;
}

/**
 * Main build function
 */
export const build = async ({
  config: userConfig,
  ctx,
}: BuildParams): Promise<void> => {
  try {
    await checkDependenciesInstallation();

    /**
     * Users can provide either:
     * 1. A preset name (string) that will be resolved from the library's built-in presets
     * 2. A preset module that follows the AzionBuildPreset interface
     *
     * Example:
     * - Using built-in preset: config.build.preset = "javascript"
     * - Using custom preset: config.build.preset = customPresetModule
     */

    const presetInput: PresetInput = userConfig.build?.preset;
    const resolvedPreset: AzionBuildPreset = await resolvePreset(presetInput);

    const buildConfigSetup = setupBuildConfig(userConfig, resolvedPreset);

    /* Execute build phases */

    // Phase 1: Prebuild
    feedback.build.info('Starting prebuild...');
    const prebuildResult: AzionPrebuildResult = await executePrebuild({
      buildConfig: buildConfigSetup,
      ctx,
    });
    feedback.build.info('Prebuild completed successfully');

    // Phase 2: Build
    feedback.build.info('Starting build...');
    await executeBuild({
      buildConfig: buildConfigSetup,
      prebuildResult,
      ctx,
    } as any);
    feedback.build.success('Build completed successfully');

    // Phase 3: Postbuild
    await executePostbuild({ buildConfig: buildConfigSetup, ctx });

    // Phase 4: Generate manifest
    await generateManifest(userConfig);

    // Phase 5: Set Environment
    await setEnvironment({ userConfig, preset: resolvedPreset, ctx });
  } catch (error: unknown) {
    (debug as any).error(error);
    feedback.build.error((error as Error).message);
    process.exit(1);
  }
};

export default build;
