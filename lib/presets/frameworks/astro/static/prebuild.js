import { exec, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    console.log('Start Astro building...');
    await exec(`${packageManager} run build`, true);
  } catch (error) {
    console.error(error);
  }
}

export default prebuild;
