import { rm } from 'fs/promises';
import { exec, copyDirectory } from '#utils';

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const newOutDir = '.edge/storage';
  const outDir = '.output/public';

  await exec('npx nuxt generate', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
