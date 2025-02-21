import {
  AzionBuild,
  AzionBuildPreset,
  AzionPrebuildResult,
} from 'azion/config';
import { BuildEnv } from 'azion/bundler';
import { feedback, injectFilesInMem, copyFilesToFS } from '#utils';

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

const processWorkerGlobalVars = (vars: Record<string, string> = {}) =>
  Object.entries(vars).reduce(
    (acc, [key, value]) => `${acc} globalThis.${key}=${value};`,
    '',
  );

const processMemoryFS = async (config: AzionBuild) => {
  const { injectionDirs, removePathPrefix } = config.memoryFS || {};
  if (!injectionDirs?.length) return '';

  const prefix =
    removePathPrefix && typeof removePathPrefix === 'string'
      ? removePathPrefix
      : '';

  const content = await injectFilesInMem(injectionDirs);
  copyFilesToFS(injectionDirs, prefix);

  return `globalThis.vulcan = {}; globalThis.vulcan.FS_PATH_PREFIX_TO_REMOVE = '${prefix}';\n${content}`;
};

export const executePrebuild = async (
  buildConfig: AzionBuild,
  preset: AzionBuildPreset,
  ctx: BuildEnv,
): Promise<AzionPrebuildResult> => {
  feedback.prebuild.info('Starting prebuild...');

  const result =
    (await preset.prebuild?.(buildConfig)) || DEFAULT_PREBUILD_RESULT;

  return {
    filesToInject: result.filesToInject || [],
    injection: {
      globals: result.injection?.globals || {},
      entry: result.filesToInject?.join(' ') || '',
      banner: `${processWorkerGlobalVars(result.injection?.globals)}${await processMemoryFS(buildConfig)}`,
    },
    bundler: {
      defineVars: result.bundler?.defineVars || {},
      plugins: result.bundler?.plugins || [],
    },
  };
};
