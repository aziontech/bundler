import {
  exec, getPackageManager, overrideStaticOutputPath, feedback,
} from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    overrideStaticOutputPath('./_config.yml', /public_dir:(.*)\n/);
    await exec(`${packageManager} hexo generate`, 'Hexo', true);
  } catch (error) {
    feedback.prebuild.error(error);
  }
}

export default prebuild;
