import { exec, feedback, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
async function prebuild(buildContext) {
  try {
    await exec(`BUILD_PATH="./.edge/storage" ${packageManager} run build`, 'React', true);
  } catch (error) {
    feedback.prebuild.error(error);
  }
}

export default prebuild;
