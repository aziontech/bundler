import { readdirSync } from 'fs';
import { join, relative } from 'path';

/**
 *
 * @param {string} rootDirectory - root directory to walk
 * @returns {Array} list of files
 */
function filenamesList(rootDirectory) {
  const result = [];
  /**
   *
   * @param {string} directory - directory to walk
   * @param {Array} list - list of files
   */
  function walk(directory, list) {
    // never step on node_modules
    if (directory !== 'node_modules') {
      // eslint-disable-next-line no-restricted-syntax
      for (const item of readdirSync(directory, { withFileTypes: true })) {
        if (item.isDirectory()) {
          walk(join(directory, item.name), list);
        } else if (item.isFile()) {
          list.push(join(directory, item.name));
        }
      }
    }
  }

  walk(rootDirectory, result);

  return result;
}

/**
 * Return a array with all assets paths
 * @param {string} dir Path to check.
 * @returns {Array} Array of all paths for all files in a directory.
 */
// eslint-disable-next-line import/prefer-default-export
export function assetsPaths(dir) {
  const paths = [];
  const filenames = filenamesList(dir);

  filenames.forEach((filename) => {
    paths.push(`/${relative(dir, filename)}`);
  });

  return paths;
}
