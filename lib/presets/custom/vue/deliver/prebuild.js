import { exec, feedback, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
async function prebuild(buildContext) {
  try {
    // This is because npm interprets arguments passed directly
    // after the script as options for npm itself, not the script itself.
    const npmArgsForward = packageManager === 'npm' ? '--' : '';
    // support npm, yarn, pnpm
    await exec(`${packageManager} run build ${npmArgsForward} --dest .edge/statics`, 'Vue', true);
  } catch (error) {
    feedback.prebuild.error(error);
  }
}

export default prebuild;
