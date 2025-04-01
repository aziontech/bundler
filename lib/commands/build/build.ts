import { dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { AzionPrebuildResult, AzionConfig, BuildContext } from 'azion/config';
import { debug } from '#utils';
import { BUILD_MESSAGES, BUILD_DEFAULTS } from '#constants';
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

interface BuildOptions {
  production?: boolean;
}

interface BuildResult {
  config: AzionConfig;
  ctx: BuildContext;
}

interface BuildParams {
  config: AzionConfig;
  options: BuildOptions;
}

export const build = async (buildParams: BuildParams): Promise<BuildResult> => {
  // Desestruturação dentro da função para facilitar o acesso
  const { config, options } = buildParams;

  try {
    await checkDependencies();

    const resolvedPreset = await resolvePreset(config.build?.preset);
    const buildConfigSetup = await setupBuildConfig(config, resolvedPreset);

    const ctx: BuildContext = {
      production: options.production ?? BUILD_DEFAULTS.PRODUCTION,
      handler: await resolveHandlers({
        entrypoint: config.build?.entry,
        preset: resolvedPreset,
      }),
    };

    /** Map of resolved worker paths and their transformed contents ready for bundling */
    const workerEntries: Record<string, string> = await setupWorkerCode(buildConfigSetup, ctx);
    console.log(workerEntries, ctx, buildConfigSetup);
    /** Write each transformed worker to its bundler entry path */

    await Promise.all(
      Object.entries(workerEntries).map(async ([path, code]) => {
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, code, 'utf-8');
      }),
    );

    /* Execute build phases */
    // Phase 1: Prebuild
    feedback.build.info(BUILD_MESSAGES.PREBUILD.START);

    const prebuildResult: AzionPrebuildResult = await executePrebuild({
      buildConfig: buildConfigSetup,
      ctx,
    });

    feedback.build.info(BUILD_MESSAGES.PREBUILD.SUCCESS);

    // Phase 2: Build
    feedback.build.info(BUILD_MESSAGES.BUILD.START);
    await executeBuild({
      buildConfig: buildConfigSetup,
      prebuildResult,
      ctx,
    });
    feedback.build.success(BUILD_MESSAGES.BUILD.SUCCESS);

    // Phase 3: Postbuild
    feedback.build.info(BUILD_MESSAGES.POSTBUILD.START);
    await executePostbuild({ buildConfig: buildConfigSetup, ctx });
    feedback.build.success(BUILD_MESSAGES.POSTBUILD.SUCCESS);

    // Phase 4: Set Environment
    await setEnvironment({ config, preset: resolvedPreset, ctx });

    return {
      config,
      ctx,
    };
  } catch (error: unknown) {
    debug.error('Build process failed:', error);
    feedback.build.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};
