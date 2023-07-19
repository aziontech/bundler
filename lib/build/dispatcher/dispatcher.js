import { join, resolve } from 'path';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { writeFile, rm } from 'fs/promises';
import { Webpack } from '#bundlers';
import { feedback, generateTimestamp, getAbsoluteLibDirPath } from '#utils';
import { Messages } from '#constants';

const vulcanLibPath = getAbsoluteLibDirPath();
const vulcanRootPath = resolve(vulcanLibPath, '..');
const isWindows = process.platform === 'win32';

/**
 * Get the valid build presets based on the folders inside the presets/default
 * and presets/custom directories.
 * @returns {string[]} An array of valid build presets.
 */
function getValidPresets() {
  const types = ['default', 'custom'];
  const validPresets = [];

  types.forEach((type) => {
    const presetsPath = join(vulcanLibPath, 'presets', type);
    const directories = readdirSync(presetsPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    validPresets.push(...directories);
  });

  return validPresets;
}

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
  const VALID_BUILD_PRESETS = getValidPresets();
  const validPreset = VALID_BUILD_PRESETS.includes(preset);

  if (!validPreset) {
    throw Error(
      'Invalid build preset. Available presets: ',
      VALID_BUILD_PRESETS.concat(','),
    );
  }

  let configFilePath;
  let prebuildFilePath;
  let handlerFilePath;

  const defaultModePath = join(vulcanLibPath, 'presets', 'default', preset, mode);
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
  }

  configFilePath = new URL(`file://${configFilePath}`).href;
  prebuildFilePath = new URL(`file://${prebuildFilePath}`).href;
  
  const config = (await import(configFilePath)).default;
  const prebuild = (await import(prebuildFilePath)).default;
  const handlerTemplate = readFileSync(handlerFilePath, 'utf-8');
  // use default provider - azion
  const workerFilePath = join(
    vulcanLibPath,
    'providers',
    'azion',
    'worker.js',
  );
  const workerTemplate = readFileSync(workerFilePath, 'utf-8');

  // build entry file string
  let newEntryContent = workerTemplate.replace('__HANDLER__', handlerTemplate);

  // resolve #edge alias without vulcan context
  const edgehooksPath = await getAliasPath('edge');
  newEntryContent = newEntryContent.replace('#edge', edgehooksPath);

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
    feedback.prebuild.info(Messages.build.info.prebuild_starting);

    const { entryContent, prebuild, config } = await loadBuildContext(
      this.preset,
      this.entry,
      this.mode,
    );

    // Run prebuild actions
    await prebuild(); // TODO: send context to prebuild
    feedback.prebuild.success(Messages.build.success.prebuild_succeeded);
    feedback.prebuild.info(Messages.build.info.vulcan_build_starting);

    // create tmp entrypoint
    const buildId = generateTimestamp(); // TODO: use versionID
    const currentDir = process.cwd();
    const tempBuilderEntryPath = join(currentDir, `vulcan-${buildId}.temp.js`);

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
    rm(tempBuilderEntryPath);
    feedback.build.success(Messages.build.success.vulcan_build_succeeded);
  };
}

export default Dispatcher;
