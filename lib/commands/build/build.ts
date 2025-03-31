import { dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { AzionPrebuildResult, AzionConfig, BuildContext } from 'azion/config';
import { debug } from '#utils';
import { BUILD_MESSAGES } from '#constants';
import { feedback } from 'azion/utils/node';

import { checkDependencies } from './utils';

/* Modules */
import { setupBuildConfig } from './modules/config';
import { resolvePreset } from './modules/preset';
import { executePrebuild } from './modules/prebuild';
import { executeBuild } from './modules/core';
import { executePostbuild } from './modules/postbuild';
import { setEnvironment } from './modules/environment';
import { setupWorkerCode } from './modules/worker';
import { resolveHandlers } from './modules/handler';

interface BuildParams {
  config: AzionConfig;
  ctx: BuildContext;
}

export const build = async ({
  config,
  ctx,
}: BuildParams): Promise<{ config: AzionConfig; ctx: BuildContext }> => {
  try {
    debug.info('Checking dependencies...');
    await checkDependencies();
    debug.info('Dependencies check completed');

    /**
     * Users can provide either:
     * 1. A preset name (string) that will be resolved from the library's built-in presets (azion/presets)
     * 2. A preset module that follows the AzionBuildPreset interface
     *
     * Example:
     * - Using built-in preset: config.build.preset = "javascript"
     * - Using custom preset: config.build.preset = customPresetModule
     */

    debug.info('Resolving preset...');
    const resolvedPreset = await resolvePreset(config.build?.preset);
    debug.info('Preset resolved:', resolvedPreset);

    debug.info('Setting up build config...');
    const buildConfigSetup = setupBuildConfig(config, resolvedPreset);
    debug.info('Build config setup completed');

    debug.info('Resolving handlers...');
    ctx.entrypoint = await resolveHandlers({
      ctx,
      preset: resolvedPreset,
    });
    debug.info('Handlers resolved');

    /** Map of resolved worker paths and their transformed contents ready for bundling */
    debug.info('Setting up worker code...');
    const workerEntries: Record<string, string> = await setupWorkerCode(
      buildConfigSetup,
      ctx,
    );
    debug.info('Worker code setup completed');

    /** Write each transformed worker to its bundler entry path */
    debug.info('Writing worker entries...');
    await Promise.all(
      Object.entries(workerEntries).map(async ([path, code]) => {
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, code, 'utf-8');
      }),
    );
    debug.info('Worker entries written successfully');

    /* Execute build phases */
    debug.info('Starting build phases...');

    // Phase 1: Prebuild
    feedback.build.info(BUILD_MESSAGES.PREBUILD.START);
    debug.info('Executing prebuild...');
    const prebuildResult: AzionPrebuildResult = await executePrebuild({
      buildConfig: buildConfigSetup,
      ctx,
    });
    debug.info('Prebuild execution completed');
    feedback.build.info(BUILD_MESSAGES.PREBUILD.SUCCESS);

    // Phase 2: Build
    feedback.build.info(BUILD_MESSAGES.BUILD.START);
    debug.info('Executing build...');
    await executeBuild({
      buildConfig: buildConfigSetup,
      prebuildResult,
      ctx,
    });
    debug.info('Build execution completed');
    feedback.build.success(BUILD_MESSAGES.BUILD.SUCCESS);

    // Phase 3: Postbuild
    feedback.build.info(BUILD_MESSAGES.POSTBUILD.START);
    debug.info('Executing postbuild...');
    await executePostbuild({ buildConfig: buildConfigSetup, ctx });
    debug.info('Postbuild execution completed');
    feedback.build.success(BUILD_MESSAGES.POSTBUILD.SUCCESS);

    // Phase 4: Set Environment
    debug.info('Setting environment...');
    await setEnvironment({ config, preset: resolvedPreset, ctx });
    debug.info('Environment setup completed');

    return {
      config,
      ctx,
    };
  } catch (error: unknown) {
    debug.error('Build process failed:', error);
    feedback.build.error(
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
};
