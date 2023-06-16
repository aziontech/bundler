import { join, resolve } from 'path';
import {
  readFileSync, readdirSync, existsSync,
} from 'fs';
import { writeFile, mkdir, rm } from 'fs/promises';
import chalk from 'chalk';
import { Webpack } from '#bundlers';
import { generateTimestamp, getAbsoluteLibDirPath } from '#utils';

const vulcanLibPath = getAbsoluteLibDirPath();
const vulcanRootPath = resolve(vulcanLibPath, '..'); //  .

/**
Get the valid build presets based on the folders inside the presets/frameworks directory.
@returns {string[]} An array of valid build presets.
 */
function getValidPresets() {
  const presetsPath = join(vulcanLibPath, 'presets', 'frameworks');
  const directories = readdirSync(presetsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  return directories;
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

  let configFilePath;
  let prebuildFilePath;
  let handlerFilePath;

  const modePath = join(vulcanLibPath, 'presets', 'frameworks', preset, mode);

  // Check if the 'mode' folder exists within the preset path
  // If the 'mode' folder exists, use its files
  if (existsSync(modePath)) {
    configFilePath = join(modePath, 'config.js');
    prebuildFilePath = join(modePath, 'prebuild.js');
    handlerFilePath = join(modePath, 'handler.js');
  }
  // If the 'mode' folder doesn't exist, use the files in the preset path`
  if (!existsSync(modePath)) {
    configFilePath = join(vulcanLibPath, 'presets', 'frameworks', preset, 'config.js');
    prebuildFilePath = join(vulcanLibPath, 'presets', 'frameworks', preset, 'prebuild.js');
    handlerFilePath = join(vulcanLibPath, 'presets', 'frameworks', preset, 'handler.js');
  }

  const config = (await import(configFilePath)).default;
  const prebuild = (await import(prebuildFilePath)).default;
  const handlerTemplate = readFileSync(handlerFilePath, 'utf-8');
  // use default provider - azion
  const workerFilePath = join(
    vulcanLibPath,
    'presets',
    'providers',
    'azion',
    'worker.js',
  );
  const workerTemplate = readFileSync(workerFilePath, 'utf-8');

  // build entry file string
  let newEntryContent = workerTemplate
    .replace('__HANDLER__', handlerTemplate);

  if (mode === 'server') {
    const filePath = join(process.cwd(), entry);
    const entryContent = readFileSync(filePath, 'utf-8');
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
    await prebuild(); // TODO: send context to prebuild
    console.log(chalk.green('Prebuild succeeded!'));

    console.log(chalk.rgb(255, 136, 0)('\nStarting Vulcan build...'));

    // create tmp entrypoint
    const buildId = generateTimestamp(); // TODO: use versionID
    const tempBuilderPath = join(vulcanRootPath, '.temp', buildId);
    const tempBuilderEntryPath = join(tempBuilderPath, 'entry.js');

    await mkdir(tempBuilderPath, { recursive: true });
    await writeFile(tempBuilderEntryPath, entryContent);

    // builder entry
    config.entry = tempBuilderEntryPath;

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

    // delete .temp files
    rm(tempBuilderPath, { recursive: true, force: true });

    console.log(chalk.rgb(255, 136, 0)('Vulcan Build succeeded!'));
  };
}

export default Dispatcher;
