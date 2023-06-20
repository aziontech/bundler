import { exec, getPackageManager, overrideStaticOutputPath } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    console.log('Start Hexo building...');

    overrideStaticOutputPath('./_config.yml', /public_dir:.*\n/, 'public_dir: .edge/statics\n');

    await exec(`${packageManager} hexo generate`, true);
  } catch (error) {
    console.error(error);
  }
}

export default prebuild;
