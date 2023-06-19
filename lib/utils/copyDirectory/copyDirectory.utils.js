import {
  existsSync, mkdirSync, readdirSync, lstatSync, copyFileSync,
} from 'fs';
import { join } from 'path';

/**
 * Recursively copies a directory to the target directory.
 * @param {string} source - The path of the source directory.
 * @param {string} target - The path of the target directory.
 */
function copyDirectory(source, target) {
  // Check if the target directory doesn't exist and create it if necessary
  if (!existsSync(target)) {
    mkdirSync(target, { recursive: true });
  }

  const files = readdirSync(source);

  files.forEach((file) => {
    const sourcePath = join(source, file);
    const targetPath = join(target, file);

    const fileStat = lstatSync(sourcePath);

    if (fileStat.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  });
}
export default copyDirectory;
