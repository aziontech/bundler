import { exec } from '#utils';
/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    console.log('Start Astro building...');
    await exec('yarn run build', true);
  } catch (error) {
    console.error(error);
  }
}

export default prebuild;