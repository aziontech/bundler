import { dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { AzionPrebuildResult, AzionConfig, BuildContext, BuildConfiguration } from 'azion/config';
import { debug } from '#utils';
import { BUILD_CONFIG_DEFAULTS } from '#constants';
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
  setup: BuildConfiguration;
}

interface BuildParams {
  config: AzionConfig;
  options: BuildOptions;
}

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
    feedback.build.info('Starting postbuild...');
    await executePostbuild({ buildConfig: buildConfigSetup, ctx });
    feedback.build.success('Postbuild completed successfully');

    // Phase 4: Set Environment
    await setEnvironment({ config, preset: resolvedPreset, ctx });

    return {
      config,
      ctx,
      setup: buildConfigSetup,
    };
  } catch (error: unknown) {
    debug.error('Build process failed:', error);
    feedback.build.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
};
