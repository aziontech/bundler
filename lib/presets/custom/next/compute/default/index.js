import { feedback } from '#utils';

/**
 * Run actions to build next for hybrid runtimes (edge or next+next).
 * @param {string} nextVersion - project next version in package.json
 */
// eslint-disable-next-line
async function run(nextVersion) {
  feedback.prebuild.info('Running default Next.js build ...');

  feedback.prebuild.error('Not implemented build!');

  process.exit(1);
}

export default run;
