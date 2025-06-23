import { dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import type { AzionPrebuildResult, BuildContext } from 'azion/config';
import { debug, removeAzionTempFiles, copyEnvVars } from '#utils';
import { BUILD_CONFIG_DEFAULTS, DOCS_MESSAGE } from '#constants';
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
import { setupBindings } from './modules/bindings';
import { BuildParams, BuildResult } from './types';

export const build = async (buildParams: BuildParams): Promise<BuildResult> => {
  try {
    const { config, options } = buildParams;
    const isProduction = Boolean(options.production);

    await checkDependencies();
    const resolvedPreset = await resolvePreset(config.build?.preset);
    const buildConfigSetup = await setupBuildConfig(config, resolvedPreset, isProduction);

    const ctx: BuildContext = {
      production: isProduction ?? BUILD_CONFIG_DEFAULTS.PRODUCTION,
      handler: await resolveHandlers({
        entrypoint: config.build?.entry,
        preset: resolvedPreset,
      }),
    };

    /** Map of resolved worker paths and their transformed contents ready for bundling */
    const workerEntries: Record<string, string> = await setupWorkerCode(buildConfigSetup, ctx);
    /** Write each transformed worker to its bundler entry path */
    await Promise.all(
      Object.entries(workerEntries).map(async ([path, code]) => {
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, code, 'utf-8');
      }),
    );

    /* Execute build phases */
    // Phase 1: Prebuild
    feedback.prebuild.info('Starting pre-build...');

    const prebuildResult: AzionPrebuildResult = await executePrebuild({
      buildConfig: buildConfigSetup,
      ctx,
    });

    feedback.prebuild.info('Pre-build completed successfully');

    // Phase 2: Build
    feedback.build.info('Starting build...');
    await executeBuild({
      buildConfig: buildConfigSetup,
      prebuildResult,
      ctx,
    });
    feedback.build.success('Build completed successfully');

    // Phase 3: Postbuild
    feedback.postbuild.info('Starting post-build...');
    await executePostbuild({ buildConfig: buildConfigSetup, ctx });
    feedback.postbuild.success('Post-build completed successfully');

    // Phase 4: Set Bindings
    await setupBindings({ config });

    // Phase 5: Setup Storage
    // TODO: Uncomment after migrating presets to the new storage system
    // await setupStorage({ config });

    // Phase 6: Set Environment
    // TODO: rafactor this to use the same function
    const mergedConfig = await setEnvironment({
      config,
      preset: resolvedPreset,
      ctx,
    });

    removeAzionTempFiles();
    await copyEnvVars();

    return {
      config: mergedConfig,
      ctx,
      setup: buildConfigSetup,
    };
  } catch (error: unknown) {
    debug.error('Build process failed:', error);
    feedback.build.error(
      `${error instanceof Error ? error.message : String(error)}${DOCS_MESSAGE}`,
    );
    process.exit(1);
  }
};
