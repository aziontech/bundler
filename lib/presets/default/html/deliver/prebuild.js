import { join } from 'path';

import { copyDirectory } from '#utils';

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
async function prebuild(buildContext) {
  const sourceDir = process.cwd();
  const targetDir = join('.', '.edge', 'statics');

  copyDirectory(sourceDir, targetDir);
}

export default prebuild;
