/* @ts-nocheck */
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, rmSync } from 'fs';
import {
  createAzionESBuildConfig,
  executeESBuildBuild,
  createAzionWebpackConfig,
  executeWebpackBuild,
  type BuildEnv,
} from 'azion/bundler';
import type { AzionBuild } from 'azion/config';
import type { AzionBuildPreset } from 'azion/presets';
import {
  feedback,
  debug,
  generateTimestamp,
  getAbsoluteLibDirPath,
  presets,
  getExportedFunctionBody,
  getPackageManager,
  getProjectJsonFile,
  relocateImportsAndRequires,
  injectFilesInMem,
  helperHandlerCode,
} from '#utils';
import { Messages } from '#constants';

const checkNodeModules = async () => {
  let projectJson;
  try {
    projectJson = getProjectJsonFile('package.json');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    feedback.prebuild.error(error);
    process.exit(1);
  }

  if (
    projectJson &&
    (projectJson.dependencies || projectJson.devDependencies)
  ) {
    const pkgManager = await getPackageManager();
    const existNodeModules = await folderExistsInProject('node_modules');

    if (!existNodeModules) {
      feedback.prebuild.error(
        Messages.build.error.install_dependencies_failed(pkgManager),
      );
      process.exit(1);
    }
  }
};

const processPresetHandler = (
  presetFiles: AzionBuildPreset,
  config: AzionBuild,
  isFirewall = false,
) => {
  const handlerTemplate = presetFiles.handler;
  const handlerTemplateBody = getExportedFunctionBody(handlerTemplate);
  let newHandlerContent;

  if (config.worker) {
    newHandlerContent = `(async function() {
      ${handlerTemplateBody}
    })()`;
  }

  if (!config.worker) {
    const presetPath = join(getAbsoluteLibDirPath(), 'providers', 'azion');
    const workerPath = join(
      presetPath,
      isFirewall ? 'firewall_worker.js' : 'worker.js',
    );
    const workerTemplate = readFileSync(workerPath, 'utf-8');

    newHandlerContent = workerTemplate.replace(
      '__HANDLER__',
      `(async function() {
        ${handlerTemplateBody}
      })()`,
    );
  }

  if (
    presetFiles.meta.name === 'javascript' ||
    presetFiles.meta.name === 'typescript'
  ) {
    try {
      const filePath = join(process.cwd(), config.entry);
      const handlerContent = readFileSync(filePath, 'utf-8');

      if (config.worker) {
        newHandlerContent = newHandlerContent.replace(
          '__JS_CODE__',
          handlerContent,
        );
      }
      if (!config.worker) {
        const entrypointModified = getExportedFunctionBody(handlerContent);
        newHandlerContent = newHandlerContent.replace(
          '__JS_CODE__',
          entrypointModified,
        );
      }

      const { matchEvent: isFirewallEvent } =
        helperHandlerCode.checkAndChangeAddEventListener(
          'firewall',
          'firewall',
          newHandlerContent,
          false,
        );

      if (!isFirewall && isFirewallEvent) {
        throw new Error(Messages.build.error.firewall_disabled);
      }
    } catch (error) {
      feedback.build.error(error.message);
      debug.error(error);
      process.exit(1);
    }
  }

  return relocateImportsAndRequires(newHandlerContent);
};

const runPrebuild = async (context: any, buildConfig: AzionBuild) => {
  const { handler, prebuild } = context;
  const prebuildContext = {
    entry: buildConfig.entry,
    polyfills: buildConfig.polyfills,
    worker: buildConfig.worker,
    memoryFS: buildConfig.memoryFS,
    preset: {
      name: buildConfig.preset.name,
      files: {
        handler,
        config: buildConfig,
        prebuild,
      },
    },
  };

  feedback.prebuild.info('Starting prebuild...');

  const prebuildResult = await prebuild(prebuildContext);
  const filesToInject = prebuildResult?.filesToInject || null;
  const workerGlobalVars = prebuildResult?.workerGlobalVars || null;
  const bundlerPlugins = prebuildResult?.bundlerPlugins || null;
  const defineVars = prebuildResult?.defineVars || null;

  const codeToInjectInHandler = { onEntry: '', onBanner: '' };

  if (workerGlobalVars) {
    codeToInjectInHandler.onBanner += Object.keys(workerGlobalVars).reduce(
      (acc, key) => `${acc} globalThis.${key}=${workerGlobalVars[key]};`,
      ' ',
    );
  }

  const { injectionDirs, removePathPrefix } = buildConfig.memoryFS || {};
  if (injectionDirs?.length > 0) {
    const content = await injectFilesInMem(injectionDirs);
    const prefix =
      removePathPrefix && typeof removePathPrefix === 'string'
        ? removePathPrefix
        : '';

    copyFilesToFS(injectionDirs, prefix);
    codeToInjectInHandler.onBanner += `globalThis.vulcan = {}; globalThis.vulcan.FS_PATH_PREFIX_TO_REMOVE = '${prefix}';\n${content}`;
  }

  if (filesToInject) {
    codeToInjectInHandler.onEntry += filesToInject.reduce(
      (acc, filePath) => `${acc} ${readFileSync(filePath, 'utf-8')}`,
      ' ',
    );
  }

  return {
    ...prebuildContext,
    bundlerPlugins,
    codeToInjectInHandler,
    defineVars,
  };
};

export const executeBuildPipeline = async (
  buildConfig: AzionBuild,
  preset: AzionBuildPreset,
  env: BuildEnv,
): Promise<void> => {
  let buildEntryTemp: string | undefined;

  try {
    await checkNodeModules();

    const VALID_BUILD_PRESETS = presets.getKeys();
    const presetName = preset.meta.name.toLowerCase();

    if (!VALID_BUILD_PRESETS.includes(presetName)) {
      feedback.build.error(Messages.build.error.invalid_preset(presetName));
      process.exit(1);
    }

    if (!preset.handler) {
      throw new Error('Preset must have handler');
    }

    buildEntryTemp = buildConfig.entry;

    const currentDir = process.cwd();
    const tempEntryFile = `azion-${generateTimestamp()}.temp.${preset.meta.name === 'typescript' ? 'ts' : 'js'}`;
    buildConfig.entry = join(currentDir, tempEntryFile);

    const processedHandler = processPresetHandler(preset, buildConfig);
    writeFileSync(buildConfig.entry, processedHandler);

    // Execute prebuild
    if (preset.prebuild) {
      const prebuildContext = await runPrebuild(preset, buildConfig);
      const { codeToInjectInHandler, bundlerPlugins, defineVars } =
        prebuildContext;

      if (codeToInjectInHandler?.onEntry) {
        let entryContent = readFileSync(buildConfig.entry, 'utf-8');
        entryContent = `${codeToInjectInHandler.onEntry} ${entryContent}`;
        entryContent = relocateImportsAndRequires(entryContent);
        writeFileSync(buildConfig.entry, entryContent);
      }

      if (codeToInjectInHandler?.onBanner) {
        buildConfig.contentToInject = codeToInjectInHandler.onBanner;
      }

      if (bundlerPlugins) {
        buildConfig.custom.plugins = buildConfig.custom.plugins
          ? [...buildConfig.custom.plugins, ...bundlerPlugins]
          : bundlerPlugins;
      }

      if (defineVars) {
        buildConfig.defineVars = defineVars;
      }
    }

    // Execute bundler
    const bundler = buildConfig.bundler?.toLowerCase() || 'webpack';
    switch (bundler) {
      case 'esbuild': {
        const esbuildConfig = createAzionESBuildConfig(buildConfig, env);
        await executeESBuildBuild(esbuildConfig.baseConfig);
        break;
      }
      case 'webpack': {
        const webpackConfig = createAzionWebpackConfig(buildConfig, env);
        await executeWebpackBuild(webpackConfig);
        break;
      }
      default:
        throw new Error(`Unsupported bundler: ${bundler}`);
    }

    // Handle polyfills
    if (buildConfig.polyfills) {
      const edgeDir = join(process.cwd(), '.edge');
      const outPath = env.production ? 'worker.js' : 'worker.dev.js';
      const workerPath = join(edgeDir, outPath);

      const content = readFileSync(workerPath, 'utf-8');
      const codeToAdd = env.production
        ? 'import SRC_NODE_FS from "node:fs";\n'
        : '';
      writeFileSync(workerPath, `${codeToAdd}${content}`);
    }

    // Execute postbuild if available
    if (preset.postbuild) {
      feedback.postbuild.info('Running post-build actions...');
      await preset.postbuild(buildConfig);
    }
  } catch (error: unknown) {
    if (buildEntryTemp && existsSync(buildEntryTemp)) {
      rmSync(buildEntryTemp);
    }
    debug.error(error);
    feedback.build.error((error as Error).message);
    process.exit(1);
  }
};
