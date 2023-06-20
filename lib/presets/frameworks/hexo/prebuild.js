import { exec, getPackageManager, overrideStaticOutputPath } from '#utils';
import chalk from 'chalk';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    console.log('Start Hexo building...');

    overrideStaticOutputPath('./_config.yml', /public_dir:(.*)\n/);

    await exec(`${packageManager} hexo generate`, true);
  } catch (error) {
    console.log(chalk.red('Build Failed:'));
    console.error(error);

    process.exit(0);
  }
}

export default prebuild;
