import { exec, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
async function prebuild(buildContext) {
  await exec(
    `BUILD_PATH="./.edge/storage" ${packageManager} run build`,
    'React',
    true,
  );
}

export default prebuild;
