import {
  AzionPrebuildResult,
  BuildContext,
  BuildConfiguration,
} from 'azion/config';
import {
  injectWorkerGlobals,
  injectWorkerMemoryFiles,
  copyFilesToLocalEdgeStorage,
  injectWorkerPathPrefix,
} from './utils';

const EDGE_STORAGE = '.edge/files';
const BUNDLER_NAMESPACE = 'bundler';

export interface PrebuildParams {
  buildConfig: BuildConfiguration;
  ctx: BuildContext;
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
}: PrebuildParams): Promise<AzionPrebuildResult> => {
  const result =
    (await buildConfig.preset.prebuild?.(buildConfig, ctx)) ||
    DEFAULT_PREBUILD_RESULT;

  const globalThisWithVars = injectWorkerGlobals({
    namespace: BUNDLER_NAMESPACE,
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

  const memoryFiles = await injectWorkerMemoryFiles({
    namespace: BUNDLER_NAMESPACE,
    property: '__FILES__',
    dirs: buildConfig.memoryFS?.injectionDirs || [],
  });

  const pathPrefix = await injectWorkerPathPrefix({
    namespace: BUNDLER_NAMESPACE,
    property: 'FS_PATH_PREFIX_TO_REMOVE',
    prefix: buildConfig.memoryFS?.removePathPrefix || '',
  });

  const globalThisWithInjections = `${globalThisWithVars}${pathPrefix}\n${memoryFiles}`;

  if (result.filesToInject?.length) {
    copyFilesToLocalEdgeStorage({
      dirs: result.filesToInject,
      prefix: '',
      outputPath: EDGE_STORAGE,
    });
  }

  return {
    filesToInject: result.filesToInject || [],
    injection: {
      globals: result.injection?.globals || {},
      entry: result.filesToInject?.join(' ') || '',
      banner: globalThisWithInjections,
    },
    bundler: {
      defineVars: result.bundler?.defineVars || {},
      plugins: result.bundler?.plugins || [],
    },
  };
};
