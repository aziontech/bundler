import {
  existsSync,
  mkdirSync,
  readdirSync,
  lstatSync,
  copyFileSync,
} from 'fs';
import { join, resolve } from 'path';

import { Utils } from '#namespaces';

/**
 * @function
 * @memberof Utils
 * @description Recursively copies a directory to the target directory, excluding any files or directories
 * that would result in the target directory being copied into itself.
 * @param {string} source - The path of the source directory.
 * @param {string} target - The path of the target directory. If the target directory is a
 * @param {boolean} ignoreDefaultFiles - ignore vulcan and azion cli default files (azion, .vulcan, ...)
 * subdirectory of the source directory, this function will avoid copying the target directory into
 * itself.
 * @example
 * // Copy a directory to the target directory
 * copyDirectory('path/to/source', 'path/to/target');
 * @example
 * // If the target directory is a subdirectory
 * of the source directory, this function will avoid copying the target directory into itself
 * copyDirectory('path/to/source', 'path/to/source/subdirectory');
 */
function copyDirectory(source, target, ignoreDefaultFiles = false) {
  const absoluteSource = resolve(source);
  const absoluteTarget = resolve(target);

  // Do not copy if source and target are the same
  if (absoluteSource === absoluteTarget) {
    return;
  }

  if (!existsSync(absoluteTarget)) {
    mkdirSync(absoluteTarget, { recursive: true });
  }

  const files = readdirSync(absoluteSource);

  files.forEach((file) => {
    const sourcePath = join(absoluteSource, file);
    const targetPath = join(absoluteTarget, file);

    if (ignoreDefaultFiles) {
      const DEFAULT_FILES_AND_DIRS = [
        /\/\.vulcan$/,
        /azion\/*$/,
        /vulcan-\d{14}\.temp\.js$/,
        /\/\.edge$/,
      ];

      const skip = DEFAULT_FILES_AND_DIRS.some((regx) => regx.test(sourcePath));
      if (skip) {
        return;
      }
    }

    // TODO: abstract to configuration file
    if (file === '.git') {
      return;
    }

    // If the target path is a subdirectory of the source path, skip copying
    if (targetPath.startsWith(sourcePath)) {
      return;
    }

    const fileStat = lstatSync(sourcePath);

    if (fileStat.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  });
}

export default copyDirectory;
