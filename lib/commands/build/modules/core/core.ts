import fsPromises from 'fs/promises';
import {
  AzionPrebuildResult,
  BuildContext,
  BuildConfiguration,
} from 'azion/config';
import bundlerExecute from './bundler-execute';

import { moveImportsToTopLevel } from './utils';

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
    if (prebuildResult.injection.entry) {
      const entryContent = await fsPromises.readFile(
        buildConfig.entry,
        'utf-8',
      );

      const contentWithInjection = `${prebuildResult.injection.entry} ${entryContent}`;
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
        const esbuildConfig = bundlerExecute.createAzionESBuildConfigWrapper(
          bundlerConfig,
          ctx,
        );
        await bundlerExecute.executeESBuildBuildWrapper(esbuildConfig);
        break;
      }
      case 'webpack': {
        const webpackConfig = bundlerExecute.createAzionWebpackConfigWrapper(
          bundlerConfig,
          ctx,
        );
        await bundlerExecute.executeWebpackBuildWrapper(webpackConfig);
        break;
      }
      default:
        throw new Error(`Unsupported bundler: ${bundler}`);
    }

    let bundledCode = await fsPromises.readFile(ctx.output, 'utf-8');
    bundledCode = injectHybridFsPolyfill(bundledCode, buildConfig, ctx);
    await fsPromises.writeFile(ctx.output, bundledCode);
    return bundledCode;
  } catch (error) {
    // TODO: check if this is necessary
    // if (buildEntryTemp && fs.existsSync(buildEntryTemp)) {
    //   fs.rmSync(buildEntryTemp);
    // }
    return Promise.reject(error);
  }
};
