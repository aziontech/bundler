import { exec, feedback, getPackageManager } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  try {
    // This is because npm interprets arguments passed directly after the script as options for npm itself, not the script itself.
    const npmArgsForward = packageManager === 'npm' ? '--' : '';
    // support npm, yarn, pnpm
    await exec(`${packageManager} run build ${npmArgsForward} --output-path=.edge/statics`, 'Angular', true);
  } catch (error) {
    feedback.prebuild.error(error);
  }
}

export default prebuild;
