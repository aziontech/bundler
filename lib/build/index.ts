import { AzionConfig, AzionPrebuildResult } from 'azion/config';
import { feedback, debug } from '#utils';
import { BuildEnv } from 'azion/bundler';
/* Modules */
import { resolveBuildConfig } from './modules/config';
import { resolvePreset } from './modules/preset';
import { executePrebuild } from './modules/prebuild';
import { executeBuild } from './modules/core';
import { executePostbuild } from './modules/postbuild';
import { generateManifest } from './modules/manifest';
import { checkDependenciesInstallation } from './utils';

interface BuildParams {
  config: AzionConfig;
  ctx: BuildEnv;
}

/**
 * Main build function
 */
export const build = async ({ config, ctx }: BuildParams): Promise<void> => {
  try {
    await checkDependenciesInstallation();
    const preset = await resolvePreset(config.build?.preset);
    const { build: buildConfig } = resolveBuildConfig(config);

    /* Execute build phases */

    // Phase 1: Prebuild
    const prebuildResult: AzionPrebuildResult = await executePrebuild({
      buildConfig,
      preset,
      ctx,
    });

    // Phase 2: Build
    feedback.build.info('Starting build...');
    await executeBuild({
      buildConfig,
      preset,
      prebuildResult,
      ctx,
    });
    feedback.build.success('Build completed successfully');

    // Phase 3: Postbuild
    await executePostbuild({ buildConfig, preset });

    // Phase 4: Generate manifest
    await generateManifest(config);
  } catch (error: unknown) {
    debug.error(error);
    feedback.build.error((error as Error).message);
    process.exit(1);
  }
};

export default build;
