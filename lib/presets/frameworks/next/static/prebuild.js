import { exec } from '#utils';
/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    console.log('Start Next building...');
    await exec('yarn run build', true);
  } catch (error) {
    console.error(error);
  }
}

export default prebuild;
