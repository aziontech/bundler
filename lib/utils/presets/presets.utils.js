import fs from 'fs';
import path from 'path';

import { Utils } from '#namespaces';

const isWindows = process.platform === 'win32';
const currentModuleFullPath = import.meta.url;
let baselibPath = currentModuleFullPath.match(/(.*bundler)(.*)/)[1];

if (isWindows) {
  baselibPath = new URL(baselibPath).pathname;
  if (baselibPath.startsWith('/')) {
    baselibPath = baselibPath.slice(1);
  }
}
if (!isWindows) {
  baselibPath = baselibPath.replace('file://', '');
}

/**
 * @function
 * @memberof Utils
 * @description Retrieves a list of presets in a beautified format.
 * Unlike `getKeys`, this method returns preset names formatted
 * for display and includes modes like '(Deliver)' or '(Compute)'.
 * Each type corresponds to a folder in the 'presets' directory.
 * @returns {string[]} The list of presets.
 * @example
 * const presetsList = getBeautify();
 * console.log(presetsList);
 * // Output might be: ['Angular', 'React', 'Vue']
 */
function getBeautify() {
  const presets = [];

  const presetsDir = path.join(baselibPath, `presets`);
  const folders = fs
    .readdirSync(presetsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => {
      const presetName = dirent.name;
      return presetName.charAt(0).toUpperCase() + presetName.slice(1);
    });

  presets.push(...folders);

  return presets;
}

/**
 * @function
 * @memberof Utils
 * @description Retrieves an array of valid preset keys.
 * Each folder name in these directories is considered as a valid preset key.
 * Unlike `getBeautify`, this method returns raw preset names without any formatting or modes.
 * @returns {string[]} An array of valid build presets.
 * @example
 * const validPresetsKeys = getKeys();
 * console.log(validKeys);
 * // Output might be: ['angular', 'react', 'vue']
 * @throws {Error} Throws an error if unable to read the directory.
 */
function getKeys() {
  const validPresets = [];

  const presetsPath = path.join(baselibPath, 'presets');
  const directories = fs
    .readdirSync(presetsPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  validPresets.push(...directories);

  return validPresets;
}

/**
 * @function
 * @memberof Utils
 * @description Creates a new preset in the lib/presets/${preset}/${mode} directory.
 * Also generates three required files: handler.js, prebuild.js, and config.js.
 * @param {string} name - The name of the new preset.
 * @throws {Error} Throws an error if a preset with the same name
 * already exists or if mode is invalid.
 * @example
 *
 * // Create a new preset named 'MyPreset'
 * presets.set('MyPreset');
 */
function set(name) {
  const presetPath = path.join(baselibPath, 'presets', name);
  fs.mkdirSync(presetPath, { recursive: true });

  fs.writeFileSync(path.join(presetPath, 'handler.js'), '');
  fs.writeFileSync(path.join(presetPath, 'prebuild.js'), '');
  fs.writeFileSync(path.join(presetPath, 'config.js'), '');
}
/**
 * @function
 * @memberof Utils
 * @description Presets object containing utility functions for working with build presets.
 * @property {Function} getKeys - Function to retrieve an array of valid preset keys.
 * These keys are raw and do not include any modes or formatting.
 * @property {Function} getBeautify - Function to retrieve a list of presets in a beautified format.
 * Unlike `getKeys`, the names are formatted and include modes like '(Compute)' or '(Deliver)'.
 * @property {Function} set - Function to create a new preset along with its required files.
 * @example
 * import { presets } from '#utils';
 *
 * // Get raw preset keys
 * const rawKeys = presets.getKeys();
 *
 * // Get beautified preset names
 * const beautifiedNames = presets.getBeautify();
 *
 *
 * // Create a new preset
 * presets.set('MyNewPreset');
 */
const presets = {
  getKeys,
  getBeautify,
  set,
};

export default presets;
