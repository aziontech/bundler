import { gte, coerce, valid, lt } from 'semver';

import { feedback } from '#utils';
import { BuildStatic } from './prebuild/index.js';

/**
 * Run actions to build next for node runtime.
 * @param {string} nextVersion - project next version in package.json
 * @param {object} buildContext - info about the build
 */
async function run(nextVersion, buildContext) {
  feedback.prebuild.info('Running build for next node server ...');

  const version = valid(coerce(nextVersion));
  if (gte(version, '12.0.0') && lt(version, '13.0.0')) {
    feedback.prebuild.info('Starting file processing!');

    const buildStatic = new BuildStatic({
      rootDir: process.cwd(),
      includeDirs: ['./.next', './public'],
      staticDirs: ['public', '.next/static'],
      excludeDirs: ['./.next/cache'],
      out: '.edge/next-build',
      versionId: buildContext.buildId,
    });

    buildStatic.run();

    feedback.prebuild.success('Not implemented build!');
  } else {
    feedback.prebuild.error('Invalid Next.js version! Available versions for node runtime: 12.x');

    process.exit(1);
  }
}

export default run;
