import fsPromises from 'fs/promises';
import {
  AzionPrebuildResult,
  BuildContext,
  BuildConfiguration,
} from 'azion/config';
import bundlers from './bundlers';

import { moveImportsToTopLevel } from './utils';
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
  // let buildEntryTemp: string | undefined;

  try {
    if (prebuildResult.filesToInject.length > 0) {
      const entryContent = await fsPromises.readFile(
        buildConfig.entry,
        'utf-8',
      );
      const filesContent = prebuildResult.filesToInject.reduce(
        (accumulator, filePath) =>
          `${accumulator} ${fs.readFileSync(filePath, 'utf-8')}`,
        ' ',
      );
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

    const bundler = buildConfig.bundler;
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
    let bundledCode = '';
    if (ctx.production === true) {
      bundledCode = await fsPromises.readFile(ctx.output, 'utf-8');
      bundledCode = injectHybridFsPolyfill(bundledCode, buildConfig, ctx);
      await fsPromises.writeFile(ctx.output, bundledCode);
    }

    return bundledCode;
  } catch (error) {
    // TODO: check if this is necessary
    // if (buildEntryTemp && fs.existsSync(buildEntryTemp)) {
    //   fs.rmSync(buildEntryTemp);
    // }
    return Promise.reject(error);
  }
};
