import { rm } from 'fs/promises';
import { exec, copyDirectory } from '#utils';

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const newOutDir = '.edge/storage';
  const outDir = '_site';

  await exec(`bundle install && bundle exec jekyll build`, 'Jekyll', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
