import { readFile, rm } from 'fs/promises';
import { exec, getPackageManager, copyDirectory } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const newOutDir = '.edge/storage';
  let outDir = 'public';

  const command = packageManager === 'npm' ? 'npx' : packageManager;
  await exec(`${command} hugo`, 'Hexo', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);
  rm(outDir, { recursive: true, force: true });
}

export default prebuild;