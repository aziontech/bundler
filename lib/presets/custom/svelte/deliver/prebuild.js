import { rm } from 'fs/promises';
import { exec, getPackageManager, copyDirectory, Manifest } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  const newOutDir = '.edge/storage';
  const outDir = 'build';

  await exec(`${packageManager} run build`, 'Svelte', true);

  // move files to vulcan default path
  copyDirectory(outDir, newOutDir);

  Manifest.setRoute({
    from: '/',
    to: '.edge/storage',
    priority: 1,
    type: 'deliver',
  });
  Manifest.generate();

  rm(outDir, { recursive: true, force: true });
}

export default prebuild;
