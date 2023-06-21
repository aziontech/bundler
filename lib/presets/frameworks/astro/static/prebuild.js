import { exec, getPackageManager, feedback } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    await exec(`${packageManager} run build`, 'Astro', true);
  } catch (error) {
    feedback.prebuild.error(error);
  }
}

export default prebuild;
