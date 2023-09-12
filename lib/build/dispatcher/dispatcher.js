import { join, resolve } from 'path';
import {
  readFileSync,
  existsSync,
  mkdirSync,
  writeFileSync,
  rmSync,
  promises as fsPromises,
} from 'fs';
import { fileURLToPath } from 'url';
import { Esbuild, Webpack } from '#bundlers';
import {
  feedback,
  debug,
  generateTimestamp,
  getAbsoluteLibDirPath,
  presets,
  getPackageManager,
} from '#utils';
import { Messages } from '#constants';
import { vulcan } from '#env';

const vulcanLibPath = getAbsoluteLibDirPath();
const vulcanRootPath = resolve(vulcanLibPath, '..');
const isWindows = process.platform === 'win32';

/**
 * Get the path corresponding to a specific alias defined in the package.json.
 * @param {string} alias - The desired alias.
 * @returns {string} The path corresponding to the alias.
 */
/**
 * Get the path corresponding to a specific alias defined in the package.json.
 * @param {string} alias - The desired alias.
 * @returns {string} The path corresponding to the alias.
 */
/**
 * Get the path corresponding to a specific alias defined in the package.json.
 * @param {string} alias - The desired alias.
 * @returns {string} The path corresponding to the alias.
 */
async function getAliasPath(alias) {
  const packageJsonPath = join(vulcanRootPath, 'package.json');
  const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  let aliasPath = packageJson.imports[`#${alias}`];
  aliasPath = aliasPath.replace('./', `${vulcanRootPath}/`);
  if (isWindows) {
    aliasPath = aliasPath.replace(/[\\/]/g, '\\\\');
  }

  return aliasPath;
}
/**
 * Move requires and imports to file init
 * @param {string} entryContent - The file content to be fixed.
 * @returns {string} The fixed file content.
 */
function fixImportsAndRequestsPlace(entryContent) {
  const importRegex = /import\s+.*?['"](.*?)['"];?/g;
  const requireRegex = /const\s.*?=\s*require\(['"](.*?)['"]\);?/g;

  const importsList = [...entryContent.matchAll(importRegex)].map(
    (match) => match[0],
  );
  const requiresList = [...entryContent.matchAll(requireRegex)].map(
    (match) => match[0],
  );

  let newCode = entryContent.replace(importRegex, '').replace(requireRegex, '');
  newCode = `${[...importsList, ...requiresList].join('\n')}\n${newCode}`;

  return newCode;
}
/**
 * Get a build context based on arguments
 * @param {string} preset - The build preset.
 * @param {string} entry - The entrypoint file path.
 * @param {string} mode - The mode of preset build.
 * @returns {any} The context that will be used in build.
 */
async function loadBuildContext(preset, entry, mode) {
  const VALID_BUILD_PRESETS = presets.getKeys();

  const validPreset = VALID_BUILD_PRESETS.includes(preset);

  if (!validPreset) {
    feedback.build.error(Messages.build.error.invalid_preset);
    process.exit(1);
  }

  let configFilePath;
  let prebuildFilePath;
  let handlerFilePath;

  const defaultModePath = join(
    vulcanLibPath,
    'presets',
    'default',
    preset,
    mode,
  );
  const customModePath = join(vulcanLibPath, 'presets', 'custom', preset, mode);
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
      Messages.build.error.invalid_preset_mode(mode, preset),
    );
    process.exit(1);
  }

  configFilePath = new URL(`file://${configFilePath}`).href;
  prebuildFilePath = new URL(`file://${prebuildFilePath}`).href;

  const config = (await import(configFilePath)).default;
  const prebuild = (await import(prebuildFilePath)).default;
  const handlerTemplate = readFileSync(handlerFilePath, 'utf-8');
  // use default provider - azion
  const workerFilePath = join(vulcanLibPath, 'providers', 'azion', 'worker.js');
  const workerTemplate = readFileSync(workerFilePath, 'utf-8');

  // build entry file string
  let newEntryContent = workerTemplate.replace('__HANDLER__', handlerTemplate);

  // resolve #edge alias without vulcan context
  const edgehooksPath = await getAliasPath('edge');
  newEntryContent = newEntryContent.replace('#edge', edgehooksPath);

  if (
    (preset === 'javascript' || preset === 'typescript') &&
    mode === 'compute'
  ) {
    try {
      const filePath = join(process.cwd(), entry);
      const entryContent = readFileSync(filePath, 'utf-8');
      newEntryContent = newEntryContent.replace('__JS_CODE__', entryContent);
    } catch (error) {
      feedback.build.error(Messages.errors.file_doesnt_exist(entry));
      debug.error(error);
      process.exit(1);
    }
  }

  newEntryContent = fixImportsAndRequestsPlace(newEntryContent);

  const buildContext = {
    entryContent: newEntryContent,
    prebuild,
    config,
  };

  return buildContext;
}

/**
Create a .env file in the build folder with specified parameters.
 * @param {string} buildId - The version ID to write into the .env file.
 * @param {string} entry - Entrypoint path.
 * @param {string} preset - The preset to write into the .env file.
 * @param {string} mode - The mode to write into the .env file.
 * @param {boolean} useNodePolyfills - The flag to indicates polyfills use.
 */
function createDotEnvFile(buildId) {
  const projectRoot = process.cwd();
  const outputPath = isWindows
    ? fileURLToPath(new URL(`file:///${join(projectRoot, '.edge')}`))
    : join(projectRoot, '.edge');
  const envFilePath = join(outputPath, '.env');

  const envContent = [`VERSION_ID=${buildId}`].join('\n');

  mkdirSync(outputPath, { recursive: true });
  writeFileSync(envFilePath, envContent);
}

/**
 * Check folder exists in project
 * @param {string} folder - Folder e.g node_modules
 * @returns {Promise<boolean>}
 */
async function folderExistsInProject(folder) {
  const filePath = join(process.cwd(), folder);
  try {
    const stats = await fsPromises.stat(filePath);
    return Promise.resolve(stats.isDirectory());
  } catch (error) {
    return Promise.resolve(false);
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
   * Create a Dispatcher.
   * @param {string} preset - The preset for the build.
   * @param {string} mode - The mode of build target.
   * @param {string} entry - The entry point for the build.
   * @param {boolean} useNodePolyfills - The flag to indicates polyfills use.
   */
  constructor(preset, mode, entry, useNodePolyfills) {
    this.preset = preset;
    this.mode = mode;
    this.entry = entry;
    this.useNodePolyfills = useNodePolyfills;
    this.buildId = generateTimestamp();
  }

  /**
   * Run the build process.
   */
  run = async () => {
    // Check install depenedencies
    const pckManager = await getPackageManager();
    const existNodeModules = await folderExistsInProject('node_modules');
    if (!existNodeModules) {
      feedback.prebuild.error(
        Messages.build.error.install_dependencies_failed(pckManager),
      );
      process.exit(1);
    }
    // Load Context based on preset
    const { entryContent, prebuild, config } = await loadBuildContext(
      this.preset,
      this.entry,
      this.mode,
    );

    const buildContext = {
      preset: this.preset,
      mode: this.mode,
      entry: this.entry,
      entryContent,
      config,
      useNodePolyfills: this.useNodePolyfills,
      buildId: this.buildId,
    };

    // Run prebuild actions
    try {
      feedback.prebuild.info(Messages.build.info.prebuild_starting);
      await prebuild(buildContext);
      createDotEnvFile(this.buildId);
      feedback.prebuild.success(Messages.build.success.prebuild_succeeded);

      feedback.build.info(Messages.build.info.vulcan_build_starting);
      // create tmp entrypoint
      const currentDir = process.cwd();
      let tempEntryFile = `vulcan-${this.buildId}.temp.`;
      tempEntryFile += this.preset === 'typescript' ? 'ts' : 'js';
      const tempBuilderEntryPath = join(currentDir, tempEntryFile);

      writeFileSync(tempBuilderEntryPath, entryContent);

      // builder entry
      config.entry = tempBuilderEntryPath;
      config.buildId = this.buildId;
      config.useNodePolyfills = this.useNodePolyfills;

      let builder;
      switch (config.builder) {
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
          preset: this.preset,
          mode: this.mode,
          useNodePolyfills: this.useNodePolyfills,
        },
        'local',
      );

      feedback.build.success(Messages.build.success.vulcan_build_succeeded);
    } catch (error) {
      feedback.build.error(error);
      process.exit(1);
    }
  };
}

export default Dispatcher;
