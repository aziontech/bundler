import { AzionPrebuildResult, AzionConfig, BuildContext } from 'azion/config';
import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { dirname } from 'path';
import fsPromises from 'fs/promises';

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
    await checkDependencies();

    /**
     * Users can provide either:
     * 1. A preset name (string) that will be resolved from the library's built-in presets (azion/presets)
     * 2. A preset module that follows the AzionBuildPreset interface
     *
     * Example:
     * - Using built-in preset: config.build.preset = "javascript"
     * - Using custom preset: config.build.preset = customPresetModule
     */

    const resolvedPreset = await resolvePreset(config.build?.preset);
    const buildConfigSetup = setupBuildConfig(config, resolvedPreset);

    ctx.entrypoint = await resolveHandlers({
      ctx,
      preset: resolvedPreset,
    });

    /** Map of resolved worker paths and their transformed contents ready for bundling */
    const workerEntries: Record<string, string> = await setupWorkerCode(
      buildConfigSetup,
      ctx,
    );

    /** Write each transformed worker to its bundler entry path */
    await Promise.all(
      Object.entries(workerEntries).map(async ([path, code]) => {
        await fsPromises.mkdir(dirname(path), { recursive: true });
        await fsPromises.writeFile(path, code, 'utf-8');
      }),
    );

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
    });
    feedback.build.success('Build completed successfully');

    // Phase 3: Postbuild
    await executePostbuild({ buildConfig: buildConfigSetup, ctx });

    // Phase 4: Set Environment
    await setEnvironment({ config, preset: resolvedPreset, ctx });

    return {
      config,
      ctx,
    };
  } catch (error: unknown) {
    debug.error(error);
    feedback.build.error(
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
};
