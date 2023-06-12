import { join } from 'path';
import {
  writeFileSync, rmSync, readFileSync, readdirSync,
} from 'fs';
import chalk from 'chalk';

import { Webpack } from '#bundlers';
import { getAbsoluteLibDirPath } from '#utils';

/**
Get the valid build targets based on the folders inside the presets/frameworks directory.
@returns {string[]} An array of valid build targets.
 */
function getValidTargets() {
  const basePath = getAbsoluteLibDirPath();
  const presetsPath = join(basePath, 'presets', 'frameworks');
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
 * @param {string} target - The build target.
 * @param {string} entry - The entrypoint file path.
 * @returns {any} The context that will be used in build.
 */
async function loadBuildContext(target, entry) {
  const VALID_BUILD_TARGETS = getValidTargets();
  const validTarget = VALID_BUILD_TARGETS.includes(target);

  if (!validTarget) {
    throw Error('Invalid build target. Available targets: ', VALID_BUILD_TARGETS.concat(','));
  }

  // set target context
  const basePath = getAbsoluteLibDirPath();

  const configFilePath = join(basePath, 'presets', 'frameworks', target, 'config.js');
  const config = (await import(configFilePath)).default;

  const prebuildFilePath = join(basePath, 'presets', 'frameworks', target, 'prebuild.js');
  const prebuild = (await import(prebuildFilePath)).default;

  const handlerFilePath = join(basePath, 'presets', 'frameworks', target, 'handler.js');
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

  // build entry file string
  let newEntryContent = workerTemplate
    .replace('__HANDLER__', handlerTemplate)
    .replace('__JS_CODE__', entryContent);

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
 * const dispatcher = new Dispatcher('dist', 'main.js', 'v1');
 * dispatcher.run();
 */
class Dispatcher {
  /**
   * Create a Dispatcher.
   * @param {string} target - The target for the build.
   * @param {string} entry - The entry point for the build.
   * @param {string} versionId - The version ID for the build.
   */
  constructor(target, entry, versionId) {
    this.target = target;
    this.entry = entry;
    this.versionId = versionId;
  }

  /**
   * Run the build process.
   */
  run = async () => {
    // Load Context based on target
    console.log(chalk.green('Starting prebuild...'));

    const {
      entryContent,
      prebuild,
      config,
    } = await loadBuildContext(this.target, this.entry);

    // Run prebuild actions
    await prebuild();
    console.log(chalk.green('Prebuild succeeded!'));

    console.log(chalk.rgb(255, 136, 0)('\nStarting Vulcan build...'));
    // create tmp entrypoint
    const tmpEntry = this.entry.replace(/\.(js|ts)\b/g, '.tmp.$1');
    writeFileSync(tmpEntry, entryContent);
    config.custom.entry = tmpEntry;

    let builder;
    switch (config.builder) {
      case 'webpack':
        builder = new Webpack(config.custom, config.useNodePolyfills);
        break;
      default:
        builder = new Webpack(config.custom, config.useNodePolyfills);
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
