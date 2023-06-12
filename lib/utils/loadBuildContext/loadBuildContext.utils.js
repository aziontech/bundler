import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Get the absolute path of the lib dir based on current module
 * @returns {string} the lib full path
 */
function getAbsoluteLibDirPath() {
  const currentModuleFullPath = import.meta.url;
  let baselibPath = currentModuleFullPath.match(/(.*lib)(.*)/)[1];
  baselibPath = baselibPath.replace('file://', '');

  return baselibPath;
}

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
export default async function loadBuildContext(target, entry) {
  const VALID_BUILD_TARGETS = getValidTargets();
  const validTarget = VALID_BUILD_TARGETS.includes(target);

  if (!validTarget) {
    throw Error('Invalid build target. Available targets: ', VALID_BUILD_TARGETS.concat(','));
  }

  // set target context
  const { config, prebuild } = await import(`#${target}Target`);

  const basePath = getAbsoluteLibDirPath();
  const handlerFilePath = join(
    basePath,
    'presets',
    'frameworks',
    target,
    'handler.js',
  );
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
