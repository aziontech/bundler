import { AzionPrebuildResult, BuildContext, BuildConfiguration } from 'azion/config';
import utils from './utils';
import { DIRECTORIES, BUNDLER } from '#constants';

export interface PrebuildParams {
  buildConfig: BuildConfiguration;
  ctx: BuildContext;
  applicationName?: string;
}

const DEFAULT_PREBUILD_RESULT: AzionPrebuildResult = {
  filesToInject: [],
  injection: {
    globals: {},
    entry: '',
    banner: '',
  },
  bundler: {
    defineVars: {},
    plugins: [],
  },
};

export const executePrebuild = async ({
  buildConfig,
  ctx,
  applicationName,
}: PrebuildParams): Promise<AzionPrebuildResult> => {
  const result = (await buildConfig.preset.prebuild?.(buildConfig, ctx)) || DEFAULT_PREBUILD_RESULT;

  const globalThisWithVars = utils.injectWorkerGlobals({
    namespace: BUNDLER.NAMESPACE,
    // Transform globals object:
    // 1. Convert object to entries
    // 2. Remove any entries with undefined values
    // 3. Ensure remaining values are typed as string
    vars: Object.fromEntries(
      Object.entries(result.injection?.globals || {})
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, v as string]),
    ),
  });

  const memoryFiles = await utils.injectWorkerMemoryFiles({
    namespace: BUNDLER.NAMESPACE,
    property: '__FILES__',
    dirs: buildConfig.memoryFS?.injectionDirs || [],
  });

  if (buildConfig.memoryFS) {
    utils.copyFilesToLocalEdgeStorage({
      dirs: buildConfig.memoryFS?.injectionDirs,
      prefix: buildConfig.memoryFS?.removePathPrefix,
      outputPath: DIRECTORIES.OUTPUT_STORAGE_PATH,
    });
  }

  const pathPrefix = await utils.injectWorkerPathPrefix({
    namespace: BUNDLER.NAMESPACE,
    property: 'FS_PATH_PREFIX_TO_REMOVE',
    prefix: buildConfig.memoryFS?.removePathPrefix || '',
  });

  const globalThisWithInjections = `${globalThisWithVars}${pathPrefix}\n${memoryFiles}`;

  /**
   * Temporary workaround for Azion's global environment variables.
   * Only applies to production builds: in `bundler dev` the local .env already has the plain
   * (unprefixed) names, so rewriting them would make the app look for a var that only exists
   * on the platform, breaking local dev.
   */
  const envAliasDefineVars = ctx.production
    ? await utils.buildEnvAliasDefineVars(process.cwd(), applicationName)
    : {};

  return {
    filesToInject: result.filesToInject || [],
    injection: {
      globals: result.injection?.globals || {},
      entry: '',
      banner: globalThisWithInjections,
    },
    bundler: {
      defineVars: { ...result.bundler?.defineVars, ...envAliasDefineVars },
      plugins: result.bundler?.plugins || [],
    },
  };
};
