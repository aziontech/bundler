import { exec, getPackageManager, Manifest } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  await exec(
    `BUILD_PATH="./.edge/storage" ${packageManager} run build`,
    'React',
    true,
  );
  Manifest.setRoute('deliver', { from: '/', to: '/storage', priority: 1 });
  Manifest.generate();
}

export default prebuild;
