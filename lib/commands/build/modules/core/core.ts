import {
  AzionPrebuildResult,
  BuildContext,
  BuildConfiguration,
} from 'azion/config';
import bundlers from './bundlers';
import { moveImportsToTopLevel } from './utils';
import fsPromises from 'fs/promises';

interface CoreParams {
  buildConfig: BuildConfiguration;
  prebuildResult: AzionPrebuildResult;
  ctx: BuildContext;
}

const injectHybridFsPolyfill = (
  code: string,
  buildConfig: BuildConfiguration,
  ctx: BuildContext,
): string => {
  if (buildConfig.polyfills && ctx.production) {
    return `import SRC_NODE_FS from "node:fs";\n${code}`;
  }
  return code;
};

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
        prebuildResult.filesToInject.map((filePath) =>
          fsPromises.readFile(filePath, 'utf-8'),
        ),
      ).then((contents) => contents.join(' '));

      await Promise.all(
        entry.map(async (tempPath) => {
          const entryContent = await fsPromises.readFile(tempPath, 'utf-8');
          const contentWithInjection = `${filesContent} ${entryContent}`;
          const contentWithTopLevelImports =
            moveImportsToTopLevel(contentWithInjection);
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

    return Promise.all(
      entry.map(async (outputPath: string) => {
        const bundledCode = await fsPromises.readFile(outputPath, 'utf-8');
        if (!ctx.production) return bundledCode;

        const bundledCodeWithHybridFsPolyfill = injectHybridFsPolyfill(
          bundledCode,
          buildConfig,
          ctx,
        );
        await fsPromises.writeFile(outputPath, bundledCodeWithHybridFsPolyfill);
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
) => {
  switch (bundlerConfig.bundler) {
    case 'esbuild': {
      const config = bundlers.createAzionESBuildConfigWrapper(
        bundlerConfig,
        ctx,
      );
      return bundlers.executeESBuildBuildWrapper(config);
    }
    case 'webpack': {
      const config = bundlers.createAzionWebpackConfigWrapper(
        bundlerConfig,
        ctx,
      );
      return bundlers.executeWebpackBuildWrapper(config);
    }
    default:
      throw new Error(`Unsupported bundler: ${bundlerConfig.bundler}`);
  }
};
