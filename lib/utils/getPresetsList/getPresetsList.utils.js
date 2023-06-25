import fs from 'fs';
import path from 'path';

/**
 * Get the list of presets.
 * @function
 * @name getPresetsList
 * @memberof Utils
 * @param {string} [type='frameworks'] - The type of presets to list.
 * Can be 'frameworks' or 'providers'.
 * @returns {string[]} The list of presets with '(Static)' or '(Server)' suffixes when applicable.
 * @example
 * const presetsList = getPresetsList('frameworks');
 * console.log(presetsList);
 * // Output: ['Next (Static)', 'Next (Server)', 'Frodo (Nine Fingers)']
 */
export function getPresetsList(type = 'frameworks') {
  const currentModuleFullPath = import.meta.url;
  let baselibPath = currentModuleFullPath.match(/(.*lib)(.*)/)[1];
  baselibPath = baselibPath.replace('file://', '');

  const presetsDir = path.join(baselibPath, `presets/${type}`);
  const folders = fs.readdirSync(presetsDir, { withFileTypes: true })

    .filter((dirent) => dirent.isDirectory())
    .flatMap((dirent) => {
      const presetName = dirent.name;
      const subDirs = fs.readdirSync(path.join(presetsDir, presetName), { withFileTypes: true })
        .filter((subDirent) => subDirent.isDirectory());

      if (subDirs.length === 0) {
        return [presetName.charAt(0).toUpperCase() + presetName.slice(1)];
      }

      return subDirs.map((subDir) => {
        const subDirName = subDir.name.charAt(0).toUpperCase() + subDir.name.slice(1);
        return `${presetName.charAt(0).toUpperCase() + presetName.slice(1)} (${subDirName})`;
      });
    });

  return folders;
}

export default getPresetsList;
