import { lstat, rm } from 'fs/promises';
import { exec, getPackageManager, copyDirectory } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const newOutDir = '.edge/storage';

  // The main folder for VitePress usually is 'docs',
  // however the users also might use the root folder
  const outDir = (await lstat('docs/'))
    ? 'docs/.vitepress/dist'
    : '.vitepress/dist';

  await exec(`${packageManager} run docs:build`, 'Vitepress', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
