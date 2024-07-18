import { join, resolve, dirname, extname } from 'path';
import {
  readFileSync,
  existsSync,
  writeFileSync,
  rmSync,
  unlinkSync,
} from 'fs';
import { transpileModule } from 'typescript';
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
  helperHandlerCode,
  generateManifest,
  copyFilesToFS,
} from '#utils';
import { Messages } from '#constants';
import vulcan from '../../env/vulcan.env.js';
import {
  getAliasPath,
  getAzionConfigPath,
  createAzionConfigFile,
  createDotEnvFile,
  folderExistsInProject,
  loadModule,
  isCommonJS,
} from './helpers/helpers.js';

const isWindows = process.platform === 'win32';

/**
 * Represents a configuration object.
 * @typedef {object} BuilderConfig
 * @property {string} entry - The entry point for the configuration
 * @property {boolean} useNodePolyfills - Indicates if Node polyfills are being used
 * @property {boolean} useOwnWorker - Indicates if a custom worker is being used
 * @property {object} custom - Custom configuration.
 * @property {*} localCustom - Local custom data
 * @property {*} preset - The preset configuration
 * @property {string} contentToInject - Content to inject
 * @property {{[key: string]: string}} defineVars - Define vars on build
 */

/**
 * Class representing a Dispatcher for build operations.
 * @example
 * const dispatcher = new Dispatcher('js', 'dist', 'main.js', 'v1');
 * dispatcher.run();
 */
class Dispatcher {
  #isFirewall;

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
   * @param {string} vulcanLibPath - Vulcan lib absolute path
   * @param {boolean} isFirewall - (Experimental) Enable isFirewall for local environment.
   */
  constructor(
    config,
    vulcanLibPath = getAbsoluteLibDirPath(),
    isFirewall = false,
  ) {
    /* configuration */
    this.entry = config.entry;
    this.builder = config.builder;
    this.preset = config.preset;
    this.useNodePolyfills = Dispatcher.checkBooleanValue(
      config.useNodePolyfills,
    );
    this.useOwnWorker = Dispatcher.checkBooleanValue(config.useOwnWorker);
    this.memoryFS = config.memoryFS;
    this.custom = config.custom;
    /* generate */
    this.vulcanLibPath = vulcanLibPath;
    this.#isFirewall = isFirewall;
  }

  /**
   * Check if the project has a package.json file and if it has dependencies or
   * devDependencies, it then checks if the node_modules folder exists and exits the process if it
   * doesn't.
   * @returns {Promise<void>} The function does not have an explicit return statement. Therefore, it does not return any
   * value.
   */
  static async checkNodeModules() {
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
   * Get a build context based on arguments
   * @returns {object} - Preset files
   */
  async loadPreset() {
    const VALID_BUILD_PRESETS = presets.getKeys();
    const vulcanRootPath = resolve(this.vulcanLibPath, '..');

    const validPreset = VALID_BUILD_PRESETS.includes(this.preset.name);
    const validMode = ['deliver', 'compute'].includes(this.preset.mode);

    if (!validPreset) {
      feedback.build.error(Messages.build.error.invalid_preset);
      process.exit(1);
    }

    if (!validMode) {
      feedback.build.error(
        Messages.build.error.invalid_preset_mode(
          this.preset.mode,
          this.preset.name,
        ),
      );
      process.exit(1);
    }

    feedback.build.info('Loading build context...');

    let configFilePath;
    let prebuildFilePath;
    let postbuildFilePath;
    let handlerFilePath;

    const modePath = join(
      this.vulcanLibPath,
      'presets',
      this.preset.name,
      this.preset.mode,
    );

    if (modePath) {
      configFilePath = join(modePath, 'config.js');
      prebuildFilePath = join(modePath, 'prebuild.js');
      postbuildFilePath = join(modePath, 'postbuild.js');
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
    postbuildFilePath = new URL(`file://${postbuildFilePath}`).href;

    const config = (await import(configFilePath)).default;
    const prebuild = (await import(prebuildFilePath)).default;

    // postbuild step is optional
    let postbuild = null;
    try {
      postbuild = (await import(postbuildFilePath)).default;
    } catch (error) {
      feedback.build.info('Build without postbuild actions.');
    }

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
      // use default worker
      let workerFilePath = join(
        this.vulcanLibPath,
        'providers',
        'azion',
        'worker.js',
      );
      // use firewall worker
      if (this.#isFirewall) {
        workerFilePath = join(
          this.vulcanLibPath,
          'providers',
          'azion',
          'firewall_worker.js',
        );
      }

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

        // this is necessary when useOwnWorker is true and --firewall is not set
        const { matchEvent: isFirewallEvent } =
          helperHandlerCode.checkAndChangeAddEventListener(
            'firewall',
            'firewall',
            newHandlerContent,
            false,
          );
        if (!this.#isFirewall && isFirewallEvent) {
          throw new Error(Messages.build.error.firewall_disabled);
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
      postbuild,
      config,
    };

    return files;
  }

  /**
   * Checks whether the input value is a boolean `true` or a string 'true'.
   * @param {boolean|string} value - The value to be checked.
   * @returns {boolean} - Returns `true` if the value is a boolean `true` or a string 'true', otherwise `false`.
   */
  static checkBooleanValue(value) {
    return value === true || value === 'true';
  }

  /**
   * Configures the build based on the provided configuration.
   * @param {object} currentConfig - The configuration object.
   * @param {string} currentConfig.build - The current build id.
   * @param {boolean} currentConfig.useNodePolyfills - The current useNodePolyfills.
   * @param {boolean} currentConfig.useOwnWorker - The current useOwnWorker.
   * @param {object} currentConfig.preset - The current preset.
   * @param {object} currentConfig.localCustom - The current localCustom.
   * @param {object} currentConfig.memoryFS - The current memoryFS.
   * @param {BuilderConfig} config - The configuration object.
   * @returns {BuilderConfig} - Returns the configured build object.
   */
  static configureBuild(currentConfig, config) {
    const { useNodePolyfills, useOwnWorker, preset, localCustom, memoryFS } =
      currentConfig;
    const buildConfig = { ...config };

    // include config preset to priority
    buildConfig.useNodePolyfills =
      Dispatcher.checkBooleanValue(useNodePolyfills) ||
      Dispatcher.checkBooleanValue(buildConfig?.useNodePolyfills);
    // include config preset to priority
    buildConfig.useOwnWorker =
      Dispatcher.checkBooleanValue(useOwnWorker) ||
      Dispatcher.checkBooleanValue(buildConfig?.useOwnWorker);
    buildConfig.localCustom = localCustom;
    buildConfig.preset = preset;
    buildConfig.memoryFS = memoryFS || buildConfig?.memoryFS;

    const currentDir = process.cwd();
    let tempEntryFile = `vulcan-${generateTimestamp()}.temp.`;
    tempEntryFile += preset.name === 'typescript' ? 'ts' : 'js';
    const tempBuilderEntryPath = join(currentDir, tempEntryFile);

    buildConfig.entry = tempBuilderEntryPath;

    return buildConfig;
  }

  static setVulcanLibAbsolutePath(filePath) {
    let content = readFileSync(filePath, 'utf-8');
    content = content.replace(/VULCAN_LIB_PATH/g, getAbsoluteLibDirPath());
    writeFileSync(filePath, content);
  }

  /**
   * Runs prebuild tasks using the provided context and build configuration.
   * @param {object} context - The context for prebuilding.
   * @param {string} context.builId - The build id.
   * @param {string} context.handler - The handler preset file.
   * @param {string} context.prebuild - The prebuild preset file.
   * @param {BuilderConfig} buildConfig - The build configuration object.
   * @returns {Promise<object>} - A promise that resolves to an object containing the prebuild context.
   */
  static async runPrebuild(context, buildConfig) {
    const { handler, prebuild } = context;
    const prebuildContext = {
      entry: buildConfig.entry,
      useNodePolyfills: buildConfig.useNodePolyfills,
      useOwnWorker: buildConfig.useOwnWorker,
      memoryFS: buildConfig.memoryFS,
      preset: {
        name: buildConfig.preset.name,
        mode: buildConfig.preset.mode,
        files: {
          handler,
          config: buildConfig,
          prebuild,
        },
      },
    };
    feedback.prebuild.info(Messages.build.info.prebuild_starting);

    const prebuildResult = await prebuild(prebuildContext);
    const filesToInject = prebuildResult?.filesToInject || null;
    const workerGlobalVars = prebuildResult?.workerGlobalVars || null;
    const builderPlugins = prebuildResult?.builderPlugins || null;
    const defineVars = prebuildResult?.defineVars || null;

    /**
     * Object containing code to be injected in a handler.
     * @typedef {object} CodeToInjectInHandler
     * @property {string} onEntry - The code that will be injected into entry.
     * @property {string} onBanner - The code that will be injected into the worker banner.
     */

    /**
     * Code to be injected in a handler.
     * @type {CodeToInjectInHandler}
     */
    const codeToInjectInHandler = { onEntry: '', onBanner: '' };

    createDotEnvFile(isWindows);

    feedback.prebuild.success(Messages.build.success.prebuild_succeeded);

    feedback.build.info(Messages.build.info.vulcan_build_starting);

    // handle global vars
    if (workerGlobalVars) {
      // return global vars definitions to inject in worker code.
      // ex: { X: 1, Y: 2} returns `globalThis.X=1; globalThis.Y=2;`
      codeToInjectInHandler.onBanner += Object.keys(workerGlobalVars).reduce(
        (accumulator, currentKey) =>
          `${accumulator} globalThis.${currentKey}=${workerGlobalVars[currentKey]};`,
        ' ',
      );
    }

    // handle in memory node fs
    const { injectionDirs, removePathPrefix } = buildConfig.memoryFS;
    if (injectionDirs && injectionDirs.length > 0) {
      const content = await injectFilesInMem(injectionDirs);

      const prefix =
        removePathPrefix &&
        typeof removePathPrefix === 'string' &&
        removePathPrefix !== ''
          ? `${removePathPrefix}`
          : `""`;

      copyFilesToFS(injectionDirs, prefix);
      // eslint-disable-next-line
      codeToInjectInHandler.onBanner += `globalThis.vulcan = {}; globalThis.vulcan.FS_PATH_PREFIX_TO_REMOVE = '${prefix}';\n${content}`;
    }

    // handle files to inject in handler
    if (filesToInject) {
      codeToInjectInHandler.onEntry += filesToInject.reduce(
        (accumulator, filePath) =>
          `${accumulator} ${readFileSync(filePath, 'utf-8')}`,
        ' ',
      );
    }

    prebuildContext.builderPlugins = builderPlugins;
    prebuildContext.codeToInjectInHandler = codeToInjectInHandler;
    prebuildContext.defineVars = defineVars;

    return Promise.resolve(prebuildContext);
  }

  /**
   * Executes the build process based on the provided build configuration.
   * @param {string} originalEntry - The original entry e.g ./index.js.
   * @param {string} builderCurrent - The builder current e.g esbuild.
   * @param {BuilderConfig} buildConfig - The build configuration object.
   * @returns {Promise<void>} - A promise that resolves when the build process is completed.
   */
  static async executeBuild(originalEntry, builderCurrent, buildConfig) {
    const builderSelected = builderCurrent || buildConfig.builder;
    let builder;
    switch (builderSelected) {
      case 'webpack':
        builder = new Webpack(buildConfig);
        break;
      case 'esbuild':
        builder = new Esbuild(buildConfig);
        break;
      default:
        builder = new Webpack(buildConfig);
        break;
    }

    // Run common build
    await builder.run();

    // delete .temp files
    rmSync(buildConfig.entry);

    await vulcan.createVulcanEnv(
      {
        builder: builderSelected,
        entry: originalEntry, // original entry
        preset: buildConfig.preset.name,
        mode: buildConfig.preset.mode,
        useNodePolyfills: buildConfig.useNodePolyfills,
        useOwnWorker: buildConfig.useOwnWorker,
      },
      'local',
    );
  }

  /**
   * Run the build process.
   * @param {boolean} processOnlyManifst - Boolean for Skip build and process just the manifest
   */
  async run(processOnlyManifst) {
    let buildEntryTemp;
    try {
      if (!processOnlyManifst) {
        await Dispatcher.checkNodeModules();

        // Load files from preset
        const { handler, prebuild, config, postbuild } =
          await this.loadPreset();
        const buildConfig = Dispatcher.configureBuild(
          {
            localCustom: this.custom,
            preset: this.preset,
            useNodePolyfills: this.useNodePolyfills,
            useOwnWorker: this.useOwnWorker,
            memoryFS: this.memoryFS,
          },
          config,
        );
        buildEntryTemp = buildConfig.entry;
        // temp entry
        writeFileSync(buildConfig?.entry, handler);

        const prebuildContext = await Dispatcher.runPrebuild(
          { handler, prebuild },
          buildConfig,
        );
        const { codeToInjectInHandler, builderPlugins, defineVars } =
          prebuildContext;

        // inject code in handler (build is necessary to pull the modules,
        // this is not a simples code append)
        if (codeToInjectInHandler && codeToInjectInHandler.onEntry !== '') {
          let entryContent = readFileSync(buildConfig?.entry, 'utf-8');
          entryContent = `${codeToInjectInHandler.onEntry} ${entryContent}`;
          entryContent = relocateImportsAndRequires(entryContent);
          writeFileSync(buildConfig?.entry, entryContent);
        }

        // inject code banner
        if (codeToInjectInHandler && codeToInjectInHandler.onBanner !== '') {
          buildConfig.contentToInject = codeToInjectInHandler.onBanner;
        }

        if (builderPlugins) {
          buildConfig.custom.plugins = buildConfig.custom.plugins
            ? [...buildConfig.custom.plugins, ...builderPlugins]
            : builderPlugins;
        }

        Dispatcher.setVulcanLibAbsolutePath(buildConfig.entry);

        // prebuildContext.defineVars
        if (defineVars) {
          buildConfig.defineVars = defineVars;
        }

        await Dispatcher.executeBuild(this.entry, this.builder, buildConfig);

        if (postbuild) {
          feedback.postbuild.info('Running postbuild actions...');
          await postbuild(buildConfig);
        }

        // fs temp solution for hybrid implementation (polyfill + runtime)
        if (this.useNodePolyfills) {
          const outPath = '.edge/worker.js';
          const content = readFileSync(outPath, 'utf-8');
          let codeToAdd = '';
          if (globalThis.vulcan.buildProd) {
            codeToAdd = 'import SRC_NODE_FS from "node:fs";\n';
          }
          const newContent = `${codeToAdd}${content}`;
          writeFileSync(outPath, newContent);
        }
      }
      // manifest
      const azionConfigPath = await getAzionConfigPath();
      const azionConfigAlreadyExists = !!azionConfigPath;

      let configModule = null;

      if (azionConfigAlreadyExists) {
        const configModulePath = dirname(azionConfigPath);
        const extension = extname(azionConfigPath);

        if (extension === '.ts') {
          const tsContent = readFileSync(azionConfigPath, 'utf-8');
          const jsContent = transpileModule(tsContent, {
            compilerOptions: {
              module: 'es2020',
              target: 'es2020',
              moduleResolution: 'node',
            },
          }).outputText;

          const tempJsPath = azionConfigPath.replace('.ts', '.temp.mjs');
          writeFileSync(tempJsPath, jsContent);

          try {
            configModule = await import(tempJsPath);
            configModule = configModule.default || configModule;
          } finally {
            unlinkSync(tempJsPath);
          }
        }
        if (extension !== '.ts') {
          configModule = await loadModule(
            configModulePath,
            'azion.config',
            extension,
          );
        }
      }

      if (!azionConfigAlreadyExists) {
        const presetAzionConfigPath = join(
          this.vulcanLibPath,
          'presets',
          this.preset.name,
          this.preset.mode,
        );

        configModule = await loadModule(
          presetAzionConfigPath,
          'azion.config',
          '.js',
        );
        await createAzionConfigFile(isCommonJS(), configModule);
      }

      const outputPath = join(process.cwd(), '.edge');
      await generateManifest(configModule, outputPath);
      feedback.build.success(Messages.build.success.manifest_succeeded);
      feedback.build.success(Messages.build.success.vulcan_build_succeeded);
    } catch (error) {
      if (existsSync(buildEntryTemp)) {
        rmSync(buildEntryTemp);
      }
      debug.error(error);
      feedback.build.error(error.message);
      process.exit(1);
    }
  }
}

export default Dispatcher;
