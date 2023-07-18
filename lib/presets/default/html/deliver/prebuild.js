import { join } from 'path';

import { copyDirectory } from '#utils';

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const sourceDir = process.cwd();
  const targetDir = join('.', '.edge', 'storage');

  copyDirectory(sourceDir, targetDir);
}

export default prebuild;
