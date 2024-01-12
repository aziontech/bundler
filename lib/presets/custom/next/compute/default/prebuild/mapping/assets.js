import { readdirSync } from 'fs';
import { join, relative } from 'path';

/**
 *
 * @param rootDirectory
 */
function filenamesList(rootDirectory) {
  const result = [];
  /**
   *
   * @param directory
   * @param list
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
 *
 * @param dir
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
