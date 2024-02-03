import { rm } from 'fs/promises';
import { exec, getPackageManager, copyDirectory, Manifest } from '#utils';

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

  // set the manifest route
  Manifest.setRoute({
    from: '/',
    to: newOutDir,
    priority: 1,
    type: 'deliver',
  });
  Manifest.generate();

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
