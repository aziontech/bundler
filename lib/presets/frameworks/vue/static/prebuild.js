import { exec } from '#utils';
/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    console.log('Start Vue building...');
    await exec('yarn run build --dest .edge/statics', true);
  } catch (error) {
    console.error(error);
  }
}

export default prebuild;
