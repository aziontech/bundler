import { exec, feedback, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    feedback.info('Start React building...');
    await exec(`BUILD_PATH="./.edge/statics" ${packageManager} run build`, true);
  } catch (error) {
    feedback.error(error);
  }
}

export default prebuild;
