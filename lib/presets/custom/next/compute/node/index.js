import {
  gte, coerce, valid, lt,
} from 'semver';

import { feedback } from '#utils';

/**
 * Run actions to build next for node runtime.
 * @param {string} nextVersion - project next version in package.json
 */
async function run(nextVersion) {
  feedback.prebuild.info('Running build for next node server ...');

  const version = valid(coerce(nextVersion));
  if (gte(version, '12.0.0') && lt(version, '13.0.0')) {
    feedback.prebuild.succes('Not implemented build!');
  }

  feedback.prebuild.error('Not implemented build! Available build for node runtime: 12.x');

  process.exit(1);
}

export default run;
