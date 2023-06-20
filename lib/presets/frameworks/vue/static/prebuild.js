import { exec, feedback, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    feedback.info('Start Vue building...');
    await exec(`${packageManager} run build --dest .edge/statics`, true);
  } catch (error) {
    feedback.error(error);
  }
}

export default prebuild;
