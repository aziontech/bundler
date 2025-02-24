import {
  AzionBuild,
  AzionBuildPreset,
  AzionPrebuildResult,
} from 'azion/config';
import { BuildEnv } from 'azion/bundler';
import {
  injectWorkerGlobals,
  injectWorkerMemoryFiles,
  copyFilesToLocalEdgeStorage,
  injectWorkerPathPrefix,
} from './utils';

const EDGE_STORAGE = '.edge/files';
const WORKER_NAMESPACE = 'vulcan';

export interface PrebuildParams {
  buildConfig: AzionBuild;
  preset: AzionBuildPreset;
  ctx: BuildEnv;
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
  preset,
  ctx,
}: PrebuildParams): Promise<AzionPrebuildResult> => {
  const result =
    (await preset.prebuild?.(buildConfig)) || DEFAULT_PREBUILD_RESULT;

  const globalThisWithVars = injectWorkerGlobals({
    namespace: WORKER_NAMESPACE,
    property: 'globals',
    vars: result.injection?.globals,
  });

  const memoryFiles = await injectWorkerMemoryFiles({
    namespace: WORKER_NAMESPACE,
    property: '__FILES__',
    dirs: buildConfig.memoryFS?.injectionDirs || [],
  });

  const pathPrefix = await injectWorkerPathPrefix({
    namespace: WORKER_NAMESPACE,
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
