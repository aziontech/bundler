import { exec, getPackageManager } from '#utils';

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
}

export default prebuild;
