import {
  AzionPrebuildResult,
  BuildContext,
  BuildConfiguration,
} from 'azion/config';
import bundlers from './bundlers';
import { moveImportsToTopLevel } from './utils';
import fsPromises from 'fs/promises';
import fs from 'fs';

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
}: CoreParams): Promise<string> => {
  try {
    if (prebuildResult.filesToInject.length > 0) {
      const entryContent = await fsPromises.readFile(
        buildConfig.entry,
        'utf-8',
      );

      const filesContentPromises = prebuildResult.filesToInject.map(
        (filePath) => fsPromises.readFile(filePath, 'utf-8'),
      );
      const filesContentArray = await Promise.all(filesContentPromises);
      const filesContent = filesContentArray.join(' ');

      const contentWithInjection = `${filesContent} ${entryContent}`;
      const contentWithTopLevelImports =
        moveImportsToTopLevel(contentWithInjection);
      await fsPromises.writeFile(buildConfig.entry, contentWithTopLevelImports);
    }

    const bundlerConfig: BuildConfiguration = {
      ...buildConfig,
      preset: buildConfig.preset,
      setup: {
        contentToInject: prebuildResult.injection.banner,
        defineVars: Object.fromEntries(
          Object.entries(prebuildResult.bundler.defineVars)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, v as string]),
        ),
      },
    };

    const { bundler } = buildConfig;
    switch (bundler) {
      case 'esbuild': {
        const esbuildConfig = bundlers.createAzionESBuildConfigWrapper(
          bundlerConfig,
          ctx,
        );
        await bundlers.executeESBuildBuildWrapper(esbuildConfig);
        break;
      }
      case 'webpack': {
        const webpackConfig = bundlers.createAzionWebpackConfigWrapper(
          bundlerConfig,
          ctx,
        );
        await bundlers.executeWebpackBuildWrapper(webpackConfig);
        break;
      }
      default:
        throw new Error(`Unsupported bundler: ${bundler}`);
    }

    const bundledCode = await fsPromises.readFile(ctx.output, 'utf-8');

    if (ctx.production) {
      const bundledCodeWithHybridFsPolyfill = injectHybridFsPolyfill(
        bundledCode,
        buildConfig,
        ctx,
      );
      await fsPromises.writeFile(ctx.output, bundledCodeWithHybridFsPolyfill);
      return bundledCodeWithHybridFsPolyfill;
    }
    return bundledCode;
  } catch (error) {
    return Promise.reject(error);
  }
};
