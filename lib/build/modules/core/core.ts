import { writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import {
  AzionBuild,
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

import { mountServiceWorker, moveImportsToTopLevel } from './utils';

interface CoreParams {
  buildConfig: BuildConfiguration;
  prebuildResult: AzionPrebuildResult;
  ctx: BuildContext;
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
}: CoreParams): Promise<void> => {
  let buildEntryTemp: string | undefined;

  try {
    if (!buildConfig.entry) {
      throw new Error('Build entry is required');
    }

    buildEntryTemp = buildConfig.entry;
    const processedHandler = mountServiceWorker(buildConfig);

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
      ...buildConfig,
      preset: buildConfig.preset,
      setup: {
        contentToInject: prebuildResult.injection.banner,
        // Transform defineVars object:
        // 1. Convert object to entries
        // 2. Remove any entries with undefined values
        // 3. Ensure remaining values are typed as string
        defineVars: Object.fromEntries(
          Object.entries(prebuildResult.bundler.defineVars)
            .filter(([_, v]) => v !== undefined)
            .map(([k, v]) => [k, v as string]),
        ),
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
