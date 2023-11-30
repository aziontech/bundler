import { exec, getPackageManager, Manifest } from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 */
async function prebuild() {
  // This is because npm interprets arguments passed directly
  // after the script as options for npm itself, not the script itself.
  const npmArgsForward = packageManager === 'npm' ? '--' : '';
  // support npm, yarn, pnpm
  await exec(
    `${packageManager} run build ${npmArgsForward} --output-path=.edge/storage`,
    'Angular',
    true,
  );

  Manifest.setRoute({
    from: '/',
    to: '.edge/storage',
    priority: 1,
    type: 'deliver',
  });
  Manifest.generate();
}

export default prebuild;
