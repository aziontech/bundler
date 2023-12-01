import { join } from 'path';

import { copyDirectory, Manifest } from '#utils';

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
// eslint-disable-next-line
async function prebuild(buildContext) {
  const sourceDir = process.cwd();
  const targetDir = join('.', '.edge', 'storage');

  copyDirectory(sourceDir, targetDir);

  Manifest.setRoute({
    from: '/',
    to: '.edge/storage',
    priority: 1,
    type: 'deliver',
  });
  Manifest.generate();
}

export default prebuild;
