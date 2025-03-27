import {
  AzionPrebuildResult,
  BuildContext,
  BuildConfiguration,
} from 'azion/config';
import bundlers from './bundlers';
import { moveImportsToTopLevel } from './utils';
import fsPromises from 'fs/promises';
import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

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

const cleanUpTempFiles = () => {
  const directory = process.cwd();
  const tempFiles = readdirSync(directory).filter(
    (file) => file.startsWith('azion-') && file.endsWith('.temp.js'),
  );

  tempFiles.forEach((file) => {
    const filePath = join(directory, file);
    unlinkSync(filePath);
  });
};

export const executeBuild = async ({
  buildConfig,
  prebuildResult,
  ctx,
}: CoreParams): Promise<string[]> => {
  try {
    const entries = Object.keys(buildConfig.entry); // Pegamos os caminhos de saída
    const results: string[] = [];

    if (prebuildResult.filesToInject.length > 0) {
      const filesContentPromises = prebuildResult.filesToInject.map(
        (filePath) => fsPromises.readFile(filePath, 'utf-8'),
      );
      const filesContentArray = await Promise.all(filesContentPromises);
      const filesContent = filesContentArray.join(' ');

      // Processa cada entrada
      for (const tempPath of Object.values(buildConfig.entry)) {
        const entryContent = await fsPromises.readFile(tempPath, 'utf-8');
        const contentWithInjection = `${filesContent} ${entryContent}`;
        const contentWithTopLevelImports =
          moveImportsToTopLevel(contentWithInjection);
        await fsPromises.writeFile(tempPath, contentWithTopLevelImports);
      }
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

    for (const outputPath of entries) {
      const bundledCode = await fsPromises.readFile(
        `${outputPath}.js`,
        'utf-8',
      );

      if (ctx.production) {
        const bundledCodeWithHybridFsPolyfill = injectHybridFsPolyfill(
          bundledCode,
          buildConfig,
          ctx,
        );
        await fsPromises.writeFile(
          `${outputPath}.js`,
          bundledCodeWithHybridFsPolyfill,
        );
        results.push(bundledCodeWithHybridFsPolyfill);
      }
      if (!ctx.production) {
        results.push(bundledCode);
      }
    }

    cleanUpTempFiles();

    return results;
  } catch (error) {
    cleanUpTempFiles();
    return Promise.reject(error);
  }
};
