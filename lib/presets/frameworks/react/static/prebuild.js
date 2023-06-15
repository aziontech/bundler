import { exec } from '#utils';
/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    console.log('Start React building...');
    await exec('BUILD_PATH="./.edge/statics" yarn run build', true);
  } catch (error) {
    console.error(error);
  }
}

export default prebuild;
