import { join } from 'path';

import { copyDirectory } from '#utils';

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
// eslint-disable-next-line
async function prebuild(buildContext) {
  const sourceDir = process.cwd();
  const targetDir = join('.', '.edge', 'storage');

  copyDirectory(sourceDir, targetDir);
}

export default prebuild;
