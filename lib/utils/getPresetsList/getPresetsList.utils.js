import fs from 'fs';
import path from 'path';

/**
 * Get the list of presets.
 * @function
 * @name getPresetsList
 * @memberof utils
 * @param {string[]} [types=['default', 'custom']] - The types of presets to list.
 * Each type corresponds to a folder in the 'presets' directory.
 * @returns {string[]} The list of presets with '(Static)' or '(Server)' suffixes when applicable.
 * @example
 * const presetsList = getPresetsList(['default', 'custom']);
 * console.log(presetsList);
 * // Output: ['Next (Static)', 'Next (Server)', 'Frodo (Nine Fingers)']
 */

const isWindows = process.platform === 'win32';

function getPresetsList(types = ['default', 'custom']) {
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

export default getPresetsList;
