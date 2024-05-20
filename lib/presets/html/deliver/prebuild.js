import { copyDirectory } from '#utils';
import { join } from 'path';

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
// eslint-disable-next-line
async function prebuild(buildContext) {
  const sourceDir = process.cwd();
  const targetDir = join('.', '.edge', 'storage');

  copyDirectory(sourceDir, targetDir, true);
}

export default prebuild;
