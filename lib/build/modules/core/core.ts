import { existsSync, rmSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import {
  AzionPrebuildResult,
  BuildContext,
  BuildConfiguration,
} from 'azion/config';
import {
  createAzionESBuildConfig,
  executeESBuildBuild,
  createAzionWebpackConfig,
  executeWebpackBuild,
} from 'azion/bundler';
import { join } from 'path';
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
  let buildEntryTemp: string | undefined;

  try {
    if (prebuildResult.injection.entry) {
      const entryContent = await readFile(buildConfig.entry, 'utf-8');
      const contentWithInjection = `${prebuildResult.injection.entry} ${entryContent}`;
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
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, v as string]),
        ),
      },
    };

    const bundler = buildConfig.bundler;
    switch (bundler) {
      case 'esbuild': {
        const esbuildConfig = createAzionESBuildConfig(bundlerConfig, ctx);
        await executeESBuildBuild(esbuildConfig);
        break;
      }
      case 'webpack': {
        const webpackConfig = createAzionWebpackConfig(bundlerConfig, ctx);
        await executeWebpackBuild(webpackConfig);
        break;
      }
      default:
        throw new Error(`Unsupported bundler: ${bundler}`);
    }

    let bundledCode = await readFile(join(process.cwd(), ctx.output), 'utf-8');
    bundledCode = injectHybridFsPolyfill(bundledCode, buildConfig, ctx);
    await writeFile(join(process.cwd(), ctx.output), bundledCode);
    return bundledCode;
  } catch (error) {
    if (buildEntryTemp && existsSync(buildEntryTemp)) {
      rmSync(buildEntryTemp);
    }
    return Promise.reject(error);
  }
};
