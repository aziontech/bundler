import { join, dirname, resolve } from 'path';
import {
  writeFileSync, rmSync, readFileSync, readdirSync, existsSync,
} from 'fs';
import chalk from 'chalk';
import { Webpack } from '#bundlers';
import { getAbsoluteLibDirPath } from '#utils';
import { packageDirectory } from 'pkg-dir';

/**
Get the valid build presets based on the folders inside the presets/frameworks directory.
@returns {string[]} An array of valid build presets.
 */
function getValidPresets() {
  const basePath = getAbsoluteLibDirPath();
  const presetsPath = join(basePath, 'presets', 'frameworks');
  const directories = readdirSync(presetsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  return directories;
}

/**
 * Get the path corresponding to a specific alias defined in the package.json.
 * @param {string} alias - The desired alias.
 * @returns {string} The path corresponding to the alias.
 */
async function getAliasPath(alias) {
  const userProjectRootPath = await packageDirectory();
  const packageJsonPath = join(userProjectRootPath, 'node_modules/vulcan/package.json');
  const packageJsonContent = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonContent);
  let aliasPath = packageJson.imports[`#${alias}`];

  const userProjectNodeModulesPath = join(userProjectRootPath, './node_modules/vulcan/');
  aliasPath = aliasPath.replace('./', userProjectNodeModulesPath);

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

  const importsList = [
    ...entryContent.matchAll(importRegex),
  ].map((match) => match[0]);
  const requiresList = [
    ...entryContent.matchAll(requireRegex),
  ].map((match) => match[0]);

  let newCode = entryContent
    .replace(importRegex, '')
    .replace(requireRegex, '');
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
  const VALID_BUILD_PRESETS = getValidPresets();
  const validPreset = VALID_BUILD_PRESETS.includes(preset);

  if (!validPreset) {
    throw Error('Invalid build preset. Available presets: ', VALID_BUILD_PRESETS.concat(','));
  }

  // set preset context
  const basePath = getAbsoluteLibDirPath();

  let configFilePath;
  let prebuildFilePath;
  let handlerFilePath;

  const modePath = join(basePath, 'presets', 'frameworks', preset, mode);

  // Check if the 'mode' folder exists within the preset path
  // If the 'mode' folder exists, use its files
  if (existsSync(modePath)) {
    configFilePath = join(modePath, 'config.js');
    prebuildFilePath = join(modePath, 'prebuild.js');
    handlerFilePath = join(modePath, 'handler.js');
  }
  // If the 'mode' folder doesn't exist, use the files in the preset path`
  if (!existsSync(modePath)) {
    configFilePath = join(basePath, 'presets', 'frameworks', preset, 'config.js');
    prebuildFilePath = join(basePath, 'presets', 'frameworks', preset, 'prebuild.js');
    handlerFilePath = join(basePath, 'presets', 'frameworks', preset, 'handler.js');
  }

  const config = (await import(configFilePath)).default;
  const prebuild = (await import(prebuildFilePath)).default;
  const handlerTemplate = readFileSync(handlerFilePath, 'utf-8');
  // use default provider - azion
  const workerFilePath = join(
    basePath,
    'presets',
    'providers',
    'azion',
    'worker.js',
  );
  const workerTemplate = readFileSync(workerFilePath, 'utf-8');

  const filePath = join(process.cwd(), entry);
  const entryContent = readFileSync(filePath, 'utf-8');

  const edgehooks = await getAliasPath('edge');

  // build entry file string
  let newEntryContent = workerTemplate
    .replace('__HANDLER__', handlerTemplate)
    .replace('#edge', edgehooks);

  if (mode === 'server') {
    newEntryContent = newEntryContent.replace('__JS_CODE__', entryContent);
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
   * @param {string} versionId - The version ID for the build.
   */
  constructor(preset, mode, entry, versionId) {
    this.preset = preset;
    this.mode = mode;
    this.entry = entry;
    this.versionId = versionId;
  }

  /**
   * Run the build process.
   */
  run = async () => {
    // Load Context based on preset
    console.log(chalk.green('Starting prebuild...'));

    const {
      entryContent,
      prebuild,
      config,
    } = await loadBuildContext(this.preset, this.entry, this.mode);

    // Run prebuild actions
    await prebuild();
    console.log(chalk.green('Prebuild succeeded!'));

    console.log(chalk.rgb(255, 136, 0)('\nStarting Vulcan build...'));
    // create tmp entrypoint
    const tmpEntry = this.entry.replace(/\.(js|ts)\b/g, '.tmp.$1');
    writeFileSync(tmpEntry, entryContent);
    config.entry = tmpEntry;

    let builder;
    switch (config.builder) {
      case 'webpack':
        builder = new Webpack(config, config.useNodePolyfills);
        break;
      default:
        builder = new Webpack(config, config.useNodePolyfills);
        break;
    }

    // Run common build
    await builder.run();

    // delete tmp entrypoint
    rmSync(tmpEntry, { force: true });

    console.log(chalk.rgb(255, 136, 0)('Vulcan Build succeeded!'));
  };
}

export default Dispatcher;
