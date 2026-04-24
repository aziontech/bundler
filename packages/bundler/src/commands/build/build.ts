import { BUILD_CONFIG_DEFAULTS, BUNDLER, DOCS_MESSAGE, TELEMETRY } from '../../constants';
import { copyEnvVars, debug, executeCleanup, markForCleanup } from '../../utils';
import {
  formatBuildConfig,
  formatHeader,
  runPhaseWithTelemetry,
  TelemetryCollector,
  TelemetryOutputFormat,
  type TelemetryBuildMetadata,
  type TelemetryConfig,
} from '@aziontech/bundler-telemetry';
import { validateConfig, type AzionPrebuildResult, type BuildContext } from '@aziontech/config';
import { feedback } from '@aziontech/utils/node';
import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

import { checkDependencies } from './utils';

/* Modules */
import { setupBindings } from './modules/bindings';
import { setupBuildConfig } from './modules/config';
import { executeBuild } from './modules/core';
import { setEnvironment } from './modules/environment';
import { resolveHandlers } from './modules/handler';
import { executePostbuild } from './modules/postbuild';
import { executePrebuild } from './modules/prebuild';
import { resolvePreset } from './modules/preset';
import { setupStorage } from './modules/storage';
import { setupWorkerCode } from './modules/worker';
import { BuildParams, BuildResult } from './types';

/**
 * Check if telemetry is enabled via environment variable or CLI flag
 */
const isTelemetryEnabled = (cliFlag?: boolean): boolean => {
  // Check CLI flag first
  if (cliFlag === true) {
    return true;
  }
  // Check environment variable - must be explicitly set to 'true'
  return process.env[TELEMETRY.ENV_ENABLED] === 'true';
};

/**
 * Get telemetry output format from environment variable
 */
const getTelemetryOutputFormat = (): TelemetryOutputFormat => {
  const format = process.env[TELEMETRY.ENV_FORMAT];
  if (format === 'console' || format === 'json' || format === 'html' || format === 'both') {
    return format;
  }
  return TELEMETRY.DEFAULT_FORMAT;
};

/**
 * Get telemetry output path from environment variable
 */
const getTelemetryOutputPath = (): string => {
  return process.env[TELEMETRY.ENV_OUTPUT] || TELEMETRY.DEFAULT_OUTPUT_PATH;
};

/**
 * Get telemetry HTML output path (defaults to same location as JSON with .html extension)
 */
const getTelemetryHtmlOutputPath = (): string => {
  return TELEMETRY.DEFAULT_HTML_OUTPUT_PATH;
};

export const build = async (buildParams: BuildParams): Promise<BuildResult> => {
  const { config, options } = buildParams;
  const isProduction = Boolean(options.production);

  // Initialize telemetry collector - disabled by default, only enabled via CLI flag or env var
  const telemetryEnabled = isTelemetryEnabled(options.telemetry);

  // Determine bundler type from config
  const bundlerType = config.build?.bundler || 'esbuild';

  // Setup telemetry config
  const telemetryConfig: TelemetryConfig = {
    enabled: telemetryEnabled,
    outputFormat: getTelemetryOutputFormat(),
    outputPath: getTelemetryOutputPath(),
    htmlOutputPath: getTelemetryHtmlOutputPath(),
  };

  const telemetryMetadata: TelemetryBuildMetadata = {
    bundlerVersion: BUNDLER.VERSION,
    preset: config.build?.preset?.toString() || 'javascript',
    bundler: bundlerType as 'esbuild' | 'webpack',
    production: isProduction,
    entry:
      typeof config.build?.entry === 'string'
        ? config.build.entry
        : Array.isArray(config.build?.entry)
          ? config.build.entry
          : config.build?.entry
            ? Object.values(config.build.entry)
            : ['./main.js'],
  };

  const telemetry = new TelemetryCollector(telemetryConfig, telemetryMetadata);

  try {
    // Start root span for the entire build
    const buildSpanId = telemetry.startSpan('build', {
      preset: telemetryMetadata.preset,
      bundler: telemetryMetadata.bundler,
      production: telemetryMetadata.production,
    });

    // Print header and build config if telemetry is enabled
    if (telemetryEnabled && telemetryConfig.outputFormat !== 'json') {
      console.log(formatHeader(BUNDLER.VERSION));
      console.log(formatBuildConfig(telemetryMetadata));
      console.log('\n⚙️  Starting build pipeline...\n');
    }

    if (options.skipFrameworkBuild) {
      feedback.build.warn('Skipping framework build');
    }

    // Phase 0: Dependencies Check
    await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'dependencies-check',
      'Dependencies Check',
      async () => checkDependencies(),
    );

    // Phase 1: Preset Resolution
    const resolvedPreset = await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'preset-resolution',
      'Preset Resolution',
      async () => resolvePreset(config.build?.preset),
    );

    // Phase 2: Build Config Setup
    const buildConfigSetup = await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'build-config-setup',
      'Build Config Setup',
      async () => setupBuildConfig(config, resolvedPreset, isProduction),
    );

    // only generate azion.config.js
    if (options.onlyGenerateConfig) {
      const mergedConfig = await setEnvironment({
        config,
        preset: resolvedPreset,
        ctx: {
          production: isProduction ?? BUILD_CONFIG_DEFAULTS.PRODUCTION,
          skipFrameworkBuild: Boolean(options.skipFrameworkBuild),
          handler: '',
        },
      });
      feedback.build.success('Build completed successfully with only azion.config');

      // validate config
      validateConfig(mergedConfig);

      telemetry.endSpan(buildSpanId);
      telemetry.printToConsole();
      await telemetry.saveReport();

      return {
        config: mergedConfig,
        ctx: {
          production: isProduction ?? BUILD_CONFIG_DEFAULTS.PRODUCTION,
          skipFrameworkBuild: Boolean(options.skipFrameworkBuild),
          handler: '',
        },
        setup: buildConfigSetup,
      };
    }

    // Phase 0: Setup context
    let context: BuildContext = {
      production: isProduction ?? BUILD_CONFIG_DEFAULTS.PRODUCTION,
      skipFrameworkBuild: Boolean(options.skipFrameworkBuild),
      handler: '',
    };

    // Phase 3: Environment Setup
    const mergedConfig = await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'environment-setup',
      'Environment Setup',
      async () => {
        const result = await setEnvironment({
          config,
          preset: resolvedPreset,
          ctx: context,
        });
        // validate config after merge
        validateConfig(result);
        return result;
      },
    );

    /* Execute build phases */
    // Phase 4: Prebuild
    feedback.prebuild.info('Starting pre-build...');

    const prebuildResult: AzionPrebuildResult = await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'prebuild',
      'Prebuild',
      async () => {
        return executePrebuild({
          buildConfig: buildConfigSetup,
          ctx: context,
        });
      },
    );

    feedback.prebuild.info('Pre-build completed successfully');

    // Phase 5: Handler Resolution
    const handler = await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'handler-resolution',
      'Handler Resolution',
      async () => {
        return resolveHandlers({
          entrypoint: config.build?.entry,
          preset: resolvedPreset,
        });
      },
    );
    context = {
      production: isProduction ?? BUILD_CONFIG_DEFAULTS.PRODUCTION,
      handler,
      skipFrameworkBuild: Boolean(options.skipFrameworkBuild),
    };

    // Phase 6: Worker Setup
    await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'worker-setup',
      'Worker Setup',
      async () => {
        /** Map of resolved worker paths and their transformed contents ready for bundling */
        const entries = await setupWorkerCode(buildConfigSetup, context);
        /** Write each transformed worker to its bundler entry path */
        const workerPaths: string[] = [];
        await Promise.all(
          Object.entries(entries).map(async ([path, code]) => {
            await mkdir(dirname(path), { recursive: true });
            await writeFile(path, code, 'utf-8');
            workerPaths.push(path);
          }),
        );

        for (const path of workerPaths) {
          await markForCleanup(path);
        }
        return entries;
      },
    );

    // Phase 7: Core Build
    feedback.build.info('Starting build...');
    await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'core-build',
      'Core Build',
      async () => {
        return executeBuild({
          buildConfig: buildConfigSetup,
          prebuildResult,
          ctx: context,
          telemetry,
          telemetryEnabled,
          telemetryOutputFormat: telemetryConfig.outputFormat,
        });
      },
    );
    feedback.build.success('Build completed successfully');

    await executeCleanup();

    // Phase 8: Postbuild
    feedback.postbuild.info('Starting post-build...');
    await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'postbuild',
      'Postbuild',
      async () => {
        await executePostbuild({ buildConfig: buildConfigSetup, ctx: context });
      },
    );
    feedback.postbuild.success('Post-build completed successfully');

    // Phase 9: Storage Setup
    const storageSetup = await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'storage-setup',
      'Storage Setup',
      async () => {
        return setupStorage({ config: mergedConfig });
      },
    );

    // Phase 10: Bindings Setup
    await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'bindings-setup',
      'Bindings Setup',
      async () => {
        await setupBindings({ config: mergedConfig, storageSetup, isProduction });
      },
    );

    // Phase 11: Copy Env Vars
    await runPhaseWithTelemetry(
      telemetry,
      telemetryEnabled,
      telemetryConfig.outputFormat,
      'env-vars-copy',
      'Copy Env Vars',
      async () => {
        await copyEnvVars();
      },
    );

    // End the root build span
    telemetry.endSpan(buildSpanId);

    // Print telemetry summary to console
    if (telemetryEnabled) {
      telemetry.printToConsole();
      await telemetry.saveReport();
    }

    return {
      config: mergedConfig,
      ctx: context,
      setup: buildConfigSetup,
    };
  } catch (error: unknown) {
    debug.error('Build process failed:', error);
    feedback.build.error(
      `${error instanceof Error ? error.message : String(error)}${DOCS_MESSAGE}`,
    );

    // Mark telemetry as failed and save report
    telemetry.markFailed(error instanceof Error ? error.message : String(error));
    if (telemetryEnabled) {
      telemetry.printToConsole();
      await telemetry.saveReport();
    }

    process.exit(1);
  }
};
