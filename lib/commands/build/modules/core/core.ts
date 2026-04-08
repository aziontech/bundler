import { AzionPrebuildResult, BuildContext, BuildConfiguration } from '@aziontech/config';
import bundlers from './bundlers';
import { moveImportsToTopLevel, injectHybridFsPolyfill } from './utils';
import fsPromises from 'fs/promises';
import os from 'os';
import { feedback } from '@aziontech/utils/node';
import { BUNDLER } from '#constants';

interface CoreParams {
  buildConfig: BuildConfiguration;
  prebuildResult: AzionPrebuildResult;
  ctx: BuildContext;
}

export const executeBuild = async ({
  buildConfig,
  prebuildResult,
  ctx,
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

    await executeBundler(bundlerConfig, ctx);

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

const executeBundler = async (bundlerConfig: BuildConfiguration, ctx: BuildContext) => {
  switch (bundlerConfig.bundler) {
    case 'esbuild': {
      if (BUNDLER.IS_DEBUG) {
        feedback.build.info('=== System Info ===');
        feedback.build.info('CPUs:', os.cpus().length);
        feedback.build.info('Total Memory:', os.totalmem() / 1024 / 1024, 'MB');
        feedback.build.info('Free Memory:', os.freemem() / 1024 / 1024, 'MB');
      }

      const config = bundlers.createAzionESBuildConfigWrapper(bundlerConfig, ctx);

      let start;
      let memBefore;
      if (BUNDLER.IS_DEBUG) {
        feedback.build.info('=== Build Test ===');
        start = Date.now();
        memBefore = process.memoryUsage();
      }

      const result = await bundlers.executeESBuildBuildWrapper(config);

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
      const config = bundlers.createAzionWebpackConfigWrapper(bundlerConfig, ctx);
      return bundlers.executeWebpackBuildWrapper(config);
    }
    default:
      throw new Error(`Unsupported bundler: ${bundlerConfig.bundler}`);
  }
};
