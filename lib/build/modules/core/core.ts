import { writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import {
  AzionBuild,
  AzionBuildPreset,
  AzionPrebuildResult,
} from 'azion/config';
import { BuildEnv, BuildConfiguration } from 'azion/bundler';
import {
  createAzionESBuildConfig,
  executeESBuildBuild,
  createAzionWebpackConfig,
  executeWebpackBuild,
} from 'azion/bundler';
import { join } from 'path';

import { mountServiceWorker, moveImportsToTopLevel } from './utils';

interface CoreParams {
  buildConfig: AzionBuild;
  preset: AzionBuildPreset;
  prebuildResult: AzionPrebuildResult;
  ctx: BuildEnv;
}

const WORKER_TEMPLATES = {
  fetch: (handler: string) =>
    `addEventListener('fetch', (event) => { event.respondWith(${handler});});`,
  firewall: (handler: string) => `addEventListener('firewall', (event) => {
  ${handler};
});`,
};

const getWorkerTemplate = (
  handler: string,
  event: 'firewall' | 'fetch',
): string => {
  return event === 'firewall'
    ? WORKER_TEMPLATES.firewall(handler)
    : WORKER_TEMPLATES.fetch(handler);
};

const injectHybridFsPolyfill = (
  code: string,
  buildConfig: AzionBuild,
  ctx: BuildEnv,
): string => {
  if (buildConfig.polyfills && ctx.production) {
    return `import SRC_NODE_FS from "node:fs";\n${code}`;
  }
  return code;
};

export const executeBuild = async ({
  buildConfig,
  preset,
  prebuildResult,
  ctx,
}: CoreParams): Promise<void> => {
  let buildEntryTemp: string | undefined;

  try {
    buildEntryTemp = buildConfig.entry;
    const processedHandler = mountServiceWorker(preset, buildConfig);

    const finalHandler = buildConfig.worker
      ? processedHandler
      : getWorkerTemplate(processedHandler, ctx.event);

    writeFileSync(buildConfig.entry, finalHandler);

    if (prebuildResult.injection.entry) {
      let entryContent = readFileSync(buildConfig.entry, 'utf-8');
      entryContent = `${prebuildResult.injection.entry} ${entryContent}`;
      entryContent = moveImportsToTopLevel(entryContent);
      writeFileSync(buildConfig.entry, entryContent);
    }

    const bundlerConfig: BuildConfiguration = {
      config: buildConfig,
      extras: {
        contentToInject: prebuildResult.injection.banner,
        defineVars: prebuildResult.bundler.defineVars,
      },
    };

    const bundler = buildConfig.bundler?.toLowerCase() || 'webpack';
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

    let bundledCode = readFileSync(join(process.cwd(), ctx.output), 'utf-8');
    bundledCode = injectHybridFsPolyfill(bundledCode, buildConfig, ctx);

    writeFileSync(join(process.cwd(), ctx.output), bundledCode);
    return Promise.resolve();
  } catch (error) {
    if (buildEntryTemp && existsSync(buildEntryTemp)) {
      rmSync(buildEntryTemp);
    }
    return Promise.reject(error);
  }
};
