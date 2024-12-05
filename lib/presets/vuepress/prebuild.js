import { lstat, rm } from 'fs/promises';
import { exec, getPackageManager, copyDirectory } from '#utils';

const packageManager = await getPackageManager();

/**
 * Check if the project uses the "/docs"
 * @returns {boolean} True if the structure is being used, false otherwise.
 */
async function docsFolderExists() {
  try {
    await lstat('docs/');
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const newOutDir = '.edge/storage';

  // The main folder for VuePress usually is 'docs',
  // however the users also might use the root folder
  const outDir = (await docsFolderExists())
    ? 'docs/.vuepress/dist'
    : '.vuepress/dist';

  await exec(`${packageManager} run docs:build`, 'Vuepress', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
