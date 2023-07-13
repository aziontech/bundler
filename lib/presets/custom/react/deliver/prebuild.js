import { exec, feedback, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    await exec(`BUILD_PATH="./.edge/storage" ${packageManager} run build`, 'React', true);
  } catch (error) {
    feedback.prebuild.error(error);
  }
}

export default prebuild;
