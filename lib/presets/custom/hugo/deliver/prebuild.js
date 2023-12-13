import { rm } from 'fs/promises';
import { exec, getPackageManager, copyDirectory } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const newOutDir = '.edge/storage';
  let outDir = 'public';

  const command = packageManager === 'npm' ? 'npx' : packageManager;
  await exec(`${command} hugo`, 'Hugo', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);
  rm(outDir, { recursive: true, force: true });

  // set the manifest route
  Manifest.setRoute({
    from: '/',
    to: newOutDir,
    priority: 1,
    type: 'deliver',
  });
  Manifest.generate();
}

export default prebuild;
