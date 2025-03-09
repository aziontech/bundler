import {
  AzionBuildPreset,
  AzionPrebuildResult,
  AzionConfig,
  BuildContext,
} from 'azion/config';
import { debug } from '#utils';
import { feedback } from 'azion/utils/node';
import { writeFile } from 'fs/promises';
/* Modules */
import { setupBuildConfig } from './modules/config';
import { resolvePreset } from './modules/preset';
import { executePrebuild } from './modules/prebuild';
import { executeBuild } from './modules/core';
import { executePostbuild } from './modules/postbuild';
import { generateManifest } from './modules/manifest';
import { checkDependenciesInstallation } from './utils';
import { setEnvironment } from './modules/environment';
import { setupWorkerCode } from './modules/worker';

const DEFAULT_PRESET = 'javascript';

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

    const presetInput = userConfig.build?.preset || DEFAULT_PRESET;
    const resolvedPreset: AzionBuildPreset = await resolvePreset(presetInput);

    const buildConfigSetup = setupBuildConfig(userConfig, resolvedPreset);

    /**
     * Resolves the handler function and converts ESM exports to worker format.
     * This step is necessary because Azion's runtime currently only supports
     * the worker format with addEventListener, not ESM modules.
     *
     * Example conversion:
     * From ESM:
     *   export default { fetch: (event) => new Response("Hello") }
     * To Worker:
     *   addEventListener('fetch', (event) => { event.respondWith(...) })
     */
    const adaptedHandler = await setupWorkerCode(buildConfigSetup, ctx);

    // Write the adapted handler to the bundler's entry file (used by webpack/esbuild)
    await writeFile(buildConfigSetup.entry, adaptedHandler);

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

    await setEnvironment({ userConfig, preset: resolvedPreset, ctx });

    // Phase 4: Generate manifest
    await generateManifest(userConfig);

    // Phase 5: Set Environment
  } catch (error: unknown) {
    debug.error(error);
    feedback.build.error(
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
};

export default build;
