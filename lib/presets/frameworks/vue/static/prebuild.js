import { exec, feedback, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    await exec(`${packageManager} run build --dest .edge/statics`, 'Vue', true);
  } catch (error) {
    feedback.prebuild.error(error);
  }
}

export default prebuild;
