import fs from 'fs';
import path from 'path';

const isWindows = process.platform === 'win32';
const currentModuleFullPath = import.meta.url;
let baselibPath = currentModuleFullPath.match(/(.*lib)(.*)/)[1];

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
 * Retrieves a list of presets from 'default' and 'custom' directories in a beautified format.
 * Unlike `getKeys`, this method returns preset names formatted
 * for display and includes modes like '(Deliver)' or '(Compute)'.
 * @function
 * @memberof presets
 * @name getBeautify
 * @param {string[]} [types=['default', 'custom']] - The types of presets to list.
 * Each type corresponds to a folder in the 'presets' directory.
 * @returns {string[]} The list of presets with modes like '(Deliver)' or '(Compute)' if applicable.
 * @example
 * const presetsList = getBeautify(['default', 'custom']);
 * console.log(presetsList);
 * // Output might be: ['Angular (Deliver)', 'React (Compute)', 'Vue (Deliver)']
 */
function getBeautify(types = ['default', 'custom']) {
  const presets = [];

  types.forEach((type) => {
    const presetsDir = path.join(baselibPath, `presets/${type}`);
    const folders = fs
      .readdirSync(presetsDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .flatMap((dirent) => {
        const presetName = dirent.name;
        const subDirs = fs
          .readdirSync(path.join(presetsDir, presetName), {
            withFileTypes: true,
          })
          .filter((subDirent) => subDirent.isDirectory());

        if (subDirs.length === 0) {
          return [presetName.charAt(0).toUpperCase() + presetName.slice(1)];
        }

        return subDirs.map((subDir) => {
          const subDirName =
            subDir.name.charAt(0).toUpperCase() + subDir.name.slice(1);
          return `${
            presetName.charAt(0).toUpperCase() + presetName.slice(1)
          } (${subDirName})`;
        });
      });

    presets.push(...folders);
  });

  return presets;
}

/**
 * Retrieves an array of valid preset keys by scanning through
 * the preset directories 'default' and 'custom'.
 * Each folder name in these directories is considered as a valid preset key.
 * Unlike `getBeautify`, this method returns raw preset names without any formatting or modes.
 * @function
 * @memberof presets
 * @name getKeys
 * @returns {string[]} An array of valid build presets.
 * @example
 * const validPresetsKeys = getKeys();
 * console.log(validKeys);
 * // Output might be: ['angular', 'react', 'vue']
 * @throws {Error} Throws an error if unable to read the directory.
 */
function getKeys() {
  const types = ['default', 'custom'];
  const validPresets = [];

  types.forEach((type) => {
    const presetsPath = path.join(baselibPath, 'presets', type);
    const directories = fs
      .readdirSync(presetsPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    validPresets.push(...directories);
  });

  return validPresets;
}

/**
 * Creates a new preset in the lib/presets/custom/${mode} directory.
 * Also generates three required files: handler.js, prebuild.js, and config.js.
 * @function
 * @memberof utils
 * @name set
 * @param {string} name - The name of the new preset.
 * @param {'compute'|'deliver'} mode - The mode for the preset, either 'compute' or 'deliver'.
 * @throws {Error} Throws an error if a preset with the same name
 * already exists or if mode is invalid.
 * @example
 *
 * // Create a new preset named 'MyPreset' in 'compute' mode
 * presets.set('MyPreset', 'compute');
 */
function set(name, mode) {
  const presetPath = path.join(baselibPath, 'presets', 'custom', name, mode);
  fs.mkdirSync(presetPath, { recursive: true });

  if (mode === 'compute') {
    const defaultFilesPath = path.join(
      baselibPath,
      'presets',
      'default',
      'javascript',
      'compute',
    );
    const filesToCopy = ['handler.js', 'config.js', 'prebuild.js'];
    filesToCopy.forEach((file) => {
      const srcPath = path.join(defaultFilesPath, file);
      const destPath = path.join(presetPath, file);
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (err) {
        console.log(err);
      }
    });
  }
  if (mode === 'deliver') {
    // TODO: Create template for 'deliver' mode init
    fs.writeFileSync(path.join(presetPath, 'handler.js'), '');
    fs.writeFileSync(path.join(presetPath, 'prebuild.js'), '');
    fs.writeFileSync(path.join(presetPath, 'config.js'), '');
  }
}

/**
 * Retrieves an array of available modes for a given preset by scanning
 * through the preset directories 'default' and 'custom'.
 * Each sub-folder name in these directories is considered as a valid mode for the preset.
 * @function
 * @memberof presets
 * @name getModes
 * @param {string} presetName - The name of the preset for which modes are to be retrieved.
 * @returns {string[]} An array of available modes for the given preset.
 * @example
 * const availableModes = getModes('angular');
 * console.log(availableModes);
 * // Output might be: ['Deliver']
 * @throws {Error} Throws an error if unable to read the directory.
 */
function getModes(presetName) {
  const types = ['default', 'custom'];
  const modes = [];

  types.forEach((type) => {
    const presetPath = path.join(baselibPath, 'presets', type, presetName);

    if (fs.existsSync(presetPath)) {
      const directories = fs
        .readdirSync(presetPath, { withFileTypes: true })
        .filter((dir) => dir.isDirectory())
        .map((dir) => dir.name.charAt(0).toUpperCase() + dir.name.slice(1));

      modes.push(...directories);
    }
  });

  return modes;
}

/**
 * Presets object containing utility functions for working with build presets.
 * @memberof utils
 * @property {Function} getKeys - Function to retrieve an array of valid preset keys.
 * These keys are raw and do not include any modes or formatting.
 * @property {Function} getBeautify - Function to retrieve a list of presets in a beautified format.
 * Unlike `getKeys`, the names are formatted and include modes like '(Compute)' or '(Deliver)'.
 * @property {Function} getModes - Function to retrieve an array of a
 * vailable modes for a given preset.
 * Each sub-folder in the 'default' and 'custom' directories is
 * considered a valid mode for the preset.
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
 * // Get available modes for a preset
 * const availableModes = presets.getModes('angular');
 *
 * // Create a new preset
 * presets.set('MyNewPreset', 'compute');
 */
const presets = {
  getKeys,
  getBeautify,
  getModes,
  set,
};

export default presets;
