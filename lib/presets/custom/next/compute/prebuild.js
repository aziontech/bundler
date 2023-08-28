import {
  feedback, getPackageManager, getPackageVersion,
} from '#utils';

const packageManager = await getPackageManager();

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
async function prebuild(buildContext) {
  feedback.prebuild.info('Starting Next.js static build process...');

  const nextVersion = getPackageVersion('next');

  feedback.prebuild.info('Detected Next.js version:', nextVersion);

  feedback.prebuild.success('Next.js build adaptation completed successfully.');
}

export default prebuild;
