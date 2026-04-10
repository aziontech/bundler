import { BUNDLER } from '../../../../constants';
import {
  TelemetryCollector,
  runPhaseWithTelemetry as originalRunPhaseWithTelemetry,
  type TelemetryOutputFormat,
} from '@aziontech/bundler-telemetry';
import { AzionPrebuildResult, BuildConfiguration, BuildContext } from '@aziontech/config';
import { feedback } from '@aziontech/utils/node';
import fsPromises from 'fs/promises';
import os from 'os';
import bundlers from './bundlers';
import { injectHybridFsPolyfill, moveImportsToTopLevel } from './utils';

/**
 * Wrapper for runPhaseWithTelemetry that handles optional telemetry
 */
const runPhaseWithTelemetry = async <T>(
  telemetry: TelemetryCollector | undefined,
  telemetryEnabled: boolean | undefined,
  outputFormat: TelemetryOutputFormat | undefined,
  phaseName: string,
  displayName: string,
  fn: () => Promise<T>,
): Promise<T> => {
  // If telemetry is not enabled, just run the function
  if (!telemetry || !telemetryEnabled) {
    return fn();
  }
  // Otherwise use the original telemetry function
  return originalRunPhaseWithTelemetry(
    telemetry,
    telemetryEnabled,
    outputFormat as TelemetryOutputFormat,
    phaseName,
    displayName,
    fn,
  );
};

interface CoreParams {
  buildConfig: BuildConfiguration;
  prebuildResult: AzionPrebuildResult;
  ctx: BuildContext;
  telemetry?: TelemetryCollector;
  telemetryEnabled?: boolean;
  telemetryOutputFormat?: TelemetryOutputFormat;
}

export const executeBuild = async ({
  buildConfig,
  prebuildResult,
  ctx,
  telemetry,
  telemetryEnabled,
  telemetryOutputFormat,
}: CoreParams): Promise<string[]> => {
  try {
    const entry =
      typeof buildConfig.entry === 'string'
        ? [buildConfig.entry]
        : Array.isArray(buildConfig.entry)
          ? buildConfig.entry
          : Object.values(buildConfig.entry);

    if (prebuildResult.filesToInject.length > 0) {
      const filesContent = await Promise.all(
        prebuildResult.filesToInject.map((filePath) => fsPromises.readFile(filePath, 'utf-8')),
      ).then((contents) => contents.join(' '));

      await Promise.all(
        entry.map(async (tempPath) => {
          const entryContent = await fsPromises.readFile(tempPath, 'utf-8');
          const contentWithInjection = `${filesContent} ${entryContent}`;
          const contentWithTopLevelImports = moveImportsToTopLevel(contentWithInjection);
          return fsPromises.writeFile(tempPath, contentWithTopLevelImports);
        }),
      );
    }
    const bundlerConfig = {
      ...buildConfig,
      setup: {
        contentToInject: prebuildResult.injection.banner,
        defineVars: Object.fromEntries(
          // Get all entries from defineVars
          Object.entries(prebuildResult.bundler.defineVars)
            // Remove entries with undefined values
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, v]) => v !== undefined)
            // Convert remaining values to string type
            .map(([k, v]) => [k, v as string]),
        ),
      },
    };

    await executeBundler(bundlerConfig, ctx, telemetry, telemetryEnabled, telemetryOutputFormat);

    // Process the final build output to inject Node.js polyfills for the Azion production runtime
    // This ensures compatibility with Node.js fs module in the Azion Edge environment
    return Promise.all(
      Object.entries(bundlerConfig.entry).map(async ([outputPath]) => {
        const finalOutputPath = outputPath.endsWith('.js') ? outputPath : `${outputPath}.js`;

        const bundledCode = await fsPromises.readFile(finalOutputPath, 'utf-8');
        if (!ctx.production) return bundledCode;

        const bundledCodeWithHybridFsPolyfill = injectHybridFsPolyfill(
          bundledCode,
          buildConfig,
          ctx,
        );

        await fsPromises.writeFile(finalOutputPath, bundledCodeWithHybridFsPolyfill);
        return bundledCodeWithHybridFsPolyfill;
      }),
    );
  } catch (error) {
    return Promise.reject(error);
  }
};

const executeBundler = async (
  bundlerConfig: BuildConfiguration,
  ctx: BuildContext,
  telemetry?: TelemetryCollector,
  telemetryEnabled?: boolean,
  telemetryOutputFormat?: TelemetryOutputFormat,
) => {
  switch (bundlerConfig.bundler) {
    case 'esbuild': {
      if (BUNDLER.IS_DEBUG) {
        feedback.build.info('=== System Info ===');
        feedback.build.info('CPUs:', os.cpus().length);
        feedback.build.info('Total Memory:', os.totalmem() / 1024 / 1024, 'MB');
        feedback.build.info('Free Memory:', os.freemem() / 1024 / 1024, 'MB');
      }

      // Measure config creation
      const config = await runPhaseWithTelemetry(
        telemetry,
        telemetryEnabled,
        telemetryOutputFormat,
        'esbuild-config-create',
        'ESBuild Config Create',
        async () => bundlers.createAzionESBuildConfigWrapper(bundlerConfig, ctx),
      );

      let start;
      let memBefore;
      if (BUNDLER.IS_DEBUG) {
        feedback.build.info('=== Build Test ===');
        start = Date.now();
        memBefore = process.memoryUsage();
      }

      // Measure esbuild execution
      const result = await runPhaseWithTelemetry(
        telemetry,
        telemetryEnabled,
        telemetryOutputFormat,
        'esbuild-execution',
        'ESBuild Execution',
        async () => bundlers.executeESBuildBuildWrapper(config),
      );

      if (BUNDLER.IS_DEBUG) {
        const duration = Date.now() - start!;
        const memAfter = process.memoryUsage();

        feedback.build.info('=== Results ===');
        feedback.build.info('Duration:', duration, 'ms');
        const delta = {
          heapUsed: `${(memAfter.heapUsed - memBefore!.heapUsed) / 1024 / 1024} MB`,
          rss: `${(memAfter.rss - memBefore!.rss) / 1024 / 1024} MB`,
        };
        feedback.build.info('Memory heapUsed:', delta.heapUsed);
        feedback.build.info('Memory rss:', delta.rss);
      }
      return result;
    }
    case 'webpack': {
      // Measure webpack config creation
      const config = await runPhaseWithTelemetry(
        telemetry,
        telemetryEnabled,
        telemetryOutputFormat,
        'webpack-config-create',
        'Webpack Config Create',
        async () => bundlers.createAzionWebpackConfigWrapper(bundlerConfig, ctx),
      );

      // Measure webpack execution
      return runPhaseWithTelemetry(
        telemetry,
        telemetryEnabled,
        telemetryOutputFormat,
        'webpack-execution',
        'Webpack Execution',
        async () => bundlers.executeWebpackBuildWrapper(config),
      );
    }
    default:
      throw new Error(`Unsupported bundler: ${bundlerConfig.bundler}`);
  }
};
