import { exec, getPackageManager, feedback } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    console.info('Start Astro building...');
    await exec(`${packageManager} run build`, true);
  } catch (error) {
    feedback.error(error);
  }
}

export default prebuild;
