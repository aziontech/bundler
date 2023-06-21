import { exec, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    console.log('Start Vue building...');
    await exec(`${packageManager} run build --dest .edge/statics`, true);
  } catch (error) {
    console.error(error);
  }
}

export default prebuild;
