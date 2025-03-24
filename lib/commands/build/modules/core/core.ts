import {
  AzionPrebuildResult,
  BuildContext,
  BuildConfiguration,
} from 'azion/config';
import {
  createAzionESBuildConfigWrapper,
  executeESBuildBuildWrapper,
  createAzionWebpackConfigWrapper,
  executeWebpackBuildWrapper,
} from './bundlers';

import { moveImportsToTopLevel } from './utils';
import { readFile, writeFile } from 'fs/promises';

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
      const entryContent = await readFile(buildConfig.entry, 'utf-8');
      const filesContent = await prebuildResult.filesToInject.reduce(
        async (accumulatorPromise, filePath) => {
          const accumulator = await accumulatorPromise;
          const fileContent = await readFile(filePath, 'utf-8');
          return `${accumulator} ${fileContent}`;
        },
        Promise.resolve(' '),
      );
      const contentWithInjection = `${filesContent} ${entryContent}`;
      const contentWithTopLevelImports =
        moveImportsToTopLevel(contentWithInjection);
      await writeFile(buildConfig.entry, contentWithTopLevelImports);
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
        const esbuildConfig = createAzionESBuildConfigWrapper(
          bundlerConfig,
          ctx,
        );
        await executeESBuildBuildWrapper(esbuildConfig);
        break;
      }
      case 'webpack': {
        const webpackConfig = createAzionWebpackConfigWrapper(
          bundlerConfig,
          ctx,
        );
        console.log('webpackConfig', webpackConfig);
        await executeWebpackBuildWrapper(webpackConfig);
        break;
      }
      default:
        throw new Error(`Unsupported bundler: ${bundler}`);
    }

    const bundledCode = await readFile(ctx.output, 'utf-8');

    if (ctx.production) {
      const bundledCodeWithHybridFsPolyfill = injectHybridFsPolyfill(
        bundledCode,
        buildConfig,
        ctx,
      );
      await writeFile(ctx.output, bundledCodeWithHybridFsPolyfill);
      return bundledCodeWithHybridFsPolyfill;
    }
    return bundledCode;
  } catch (error) {
    return Promise.reject(error);
  }
};
