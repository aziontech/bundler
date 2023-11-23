import { join, resolve } from 'path';
import { readFileSync, existsSync, writeFileSync, rmSync } from 'fs';
import { Esbuild, Webpack } from '#bundlers';
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
} from '#utils';
import { Messages } from '#constants';
import { vulcan } from '#env';
import {
  getAliasPath,
  createDotEnvFile,
  folderExistsInProject,
} from './helpers/helpers.js';

const isWindows = process.platform === 'win32';

/**
 * Check if the project has a package.json file and if it has dependencies or
 * devDependencies, it then checks if the node_modules folder exists and exits the process if it
 * doesn't.
 * @returns {Promise<void>} The function does not have an explicit return statement. Therefore, it does not return any
 * value.
 */
async function checkNodeModules() {
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
}

/**
 * Class representing a Dispatcher for build operations.
 * @example
 * const dispatcher = new Dispatcher('js', 'dist', 'main.js', 'v1');
 * dispatcher.run();
 */
class Dispatcher {
  /**
   * Create a build configuration object.
   * @param {object} config - The configuration object.
   * @param {string} [config.entry] - The entry point for the build.
   * @param {string}[config.builder] - The name of the Bundler you want to use (Esbuild or Webpack)
   * @param {object} [config.preset] - The preset configuration for the build.
   * @param {string} [config.preset.name] - The name of the preset.
   * @param {string} [config.preset.mode] - The mode of the build target.
   * @param {boolean} [config.useNodePolyfills] - Flag indicating whether to use Node.js polyfills.
   * @param {boolean} [config.useOwnWorker] - Flag indicating whether the constructed code inserts its own worker expression without the need to inject a provider.
   * @param {string[]|undefined} [config.memoryFS] - Reference to dirs that contains files to be injected in worker memory.
   * @param {object} [config.custom] - Custom Bundle configuration.
   * @param {string } buildId - Build ID
   * @param {string} vulcanLibPath - Vulcan lib absolute path
   */
  constructor(
    config,
    buildId = generateTimestamp(),
    vulcanLibPath = getAbsoluteLibDirPath(),
  ) {
    /* configuration */
    this.entry = config.entry;
    this.builder = config.builder;
    this.preset = config.preset;
    this.useNodePolyfills =
      config.useNodePolyfills === 'true' || config.useNodePolyfills === true;
    this.useOwnWorker =
      config.useOwnWorker === 'true' || config.useOwnWorker === true;
    this.memoryFS = config.memoryFS;
    this.custom = config.custom;
    /* generate */
    this.buildId = buildId;
    this.vulcanLibPath = vulcanLibPath;
  }

  /**
   * Get a build context based on arguments
   * @returns {object} - Preset files
   */
  async loadPreset() {
    const VALID_BUILD_PRESETS = presets.getKeys();
    const vulcanRootPath = resolve(this.vulcanLibPath, '..');

    const validPreset = VALID_BUILD_PRESETS.includes(this.preset.name);

    if (!validPreset) {
      feedback.build.error(Messages.build.error.invalid_preset);
      process.exit(1);
    }

    let configFilePath;
    let prebuildFilePath;
    let handlerFilePath;

    const defaultModePath = join(
      this.vulcanLibPath,
      'presets',
      'default',
      this.preset.name,
      this.preset.mode,
    );
    const customModePath = join(
      this.vulcanLibPath,
      'presets',
      'custom',
      this.preset.name,
      this.preset.mode,
    );
    let modePath;

    // Check if the 'mode' folder exists within the default or custom preset paths
    if (existsSync(defaultModePath)) {
      modePath = defaultModePath;
    } else if (existsSync(customModePath)) {
      modePath = customModePath;
    }

    if (modePath) {
      configFilePath = join(modePath, 'config.js');
      prebuildFilePath = join(modePath, 'prebuild.js');
      handlerFilePath = join(modePath, 'handler.js');
    } else {
      feedback.build.error(
        Messages.build.error.invalid_preset_mode(
          this.preset.mode,
          this.preset.name,
        ),
      );
      process.exit(1);
    }

    configFilePath = new URL(`file://${configFilePath}`).href;
    prebuildFilePath = new URL(`file://${prebuildFilePath}`).href;

    const config = (await import(configFilePath)).default;

    const prebuild = (await import(prebuildFilePath)).default;
    const handlerTemplate = readFileSync(handlerFilePath, 'utf-8');
    const handlerTemplateBody = getExportedFunctionBody(handlerTemplate);

    let newHandlerContent;

    if (this.useOwnWorker) {
      newHandlerContent = `(async function() {
      ${handlerTemplateBody}
    })()`;
    }

    // use providers
    if (!this.useOwnWorker) {
      const workerFilePath = join(
        this.vulcanLibPath,
        'providers',
        'azion',
        'worker.js',
      );

      const workerTemplate = readFileSync(workerFilePath, 'utf-8');
      newHandlerContent = workerTemplate.replace(
        '__HANDLER__',
        `(async function() {
        ${handlerTemplateBody}
      })()`,
      );
    }

    // resolve #edge alias without vulcan context
    const edgehooksPath = getAliasPath('edge', vulcanRootPath, isWindows);
    newHandlerContent = newHandlerContent?.replace('#edge', edgehooksPath);

    if (
      (this.preset.name === 'javascript' ||
        this.preset.name === 'typescript') &&
      this.preset.mode === 'compute'
    ) {
      try {
        const filePath = join(process.cwd(), this.entry);
        const handlerContent = readFileSync(filePath, 'utf-8');

        if (this.useOwnWorker) {
          newHandlerContent = newHandlerContent.replace(
            '__JS_CODE__',
            handlerContent,
          );
        }
        if (!this.useOwnWorker) {
          const entrypointModified = getExportedFunctionBody(handlerContent);
          newHandlerContent = newHandlerContent.replace(
            '__JS_CODE__',
            entrypointModified,
          );
        }
      } catch (error) {
        feedback.build.error(error.message);
        debug.error(error);
        process.exit(1);
      }
    }
    newHandlerContent = relocateImportsAndRequires(newHandlerContent);

    const files = {
      handler: newHandlerContent,
      prebuild,
      config,
    };

    return files;
  }

  /**
   * Run the build process.
   */
  async run() {
    await checkNodeModules();

    // Load files from preset
    const { handler, prebuild, config } = await this.loadPreset();

    const context = {
      buildId: this.buildId,
      entry: this.entry,
      useNodePolyfills: this.useNodePolyfills,
      useOwnWorker: this.useOwnWorker,
      memoryFS: this.memoryFS,
      preset: {
        name: this.preset.name,
        mode: this.preset.mode,
        files: {
          handler,
          config,
          prebuild,
        },
      },
    };

    const currentDir = process.cwd();
    let tempEntryFile = `vulcan-${this.buildId}.temp.`;
    tempEntryFile += this.preset.name === 'typescript' ? 'ts' : 'js';
    const tempBuilderEntryPath = join(currentDir, tempEntryFile);

    writeFileSync(tempBuilderEntryPath, handler);

    // Run prebuild actions
    try {
      feedback.prebuild.info(Messages.build.info.prebuild_starting);
      await prebuild(context);
      createDotEnvFile(this.buildId, isWindows);
      feedback.prebuild.success(Messages.build.success.prebuild_succeeded);

      feedback.build.info(Messages.build.info.vulcan_build_starting);

      // builder entry
      config.entry = tempBuilderEntryPath;
      config.buildId = this.buildId;
      config.useNodePolyfills = this.useNodePolyfills;
      config.useOwnWorker = this.useOwnWorker;
      config.localCustom = this.custom;

      const builderSelected = this.builder || config.builder;

      const { injectionDirs, removePathPrefix } = this.memoryFS;
      if (injectionDirs && injectionDirs.length > 0) {
        const content = await injectFilesInMem(injectionDirs);

        const prefix =
          removePathPrefix &&
          typeof removePathPrefix === 'string' &&
          removePathPrefix !== ''
            ? `'${removePathPrefix}'`
            : `''`;

        config.contentToInject = `globalThis.vulcan = {}; globalThis.vulcan.FS_PATH_PREFIX_TO_REMOVE = ${prefix};\n${content}`;
      }

      let builder;
      switch (builderSelected) {
        case 'webpack':
          builder = new Webpack(config);
          break;
        case 'esbuild':
          builder = new Esbuild(config);
          break;
        default:
          builder = new Webpack(config);
          break;
      }

      // Run common build
      await builder.run();

      // delete .temp files
      rmSync(tempBuilderEntryPath);

      await vulcan.createVulcanEnv(
        {
          entry: this.entry,
          preset: this.preset.name,
          mode: this.preset.mode,
          ...(this.useNodePolyfills && {
            useNodePolyfills: this.useNodePolyfills,
          }),
          ...(this.useOwnWorker && {
            useOwnWorker: this.useOwnWorker,
          }),
        },
        'local',
      );

      feedback.build.success(Messages.build.success.vulcan_build_succeeded);
    } catch (error) {
      rmSync(tempBuilderEntryPath);
      feedback.build.error(error);
      process.exit(1);
    }
  }
}

export default Dispatcher;
