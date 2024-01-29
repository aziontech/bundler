import { gte, coerce, valid, lt } from 'semver';
import path, { join } from 'path';
import fs from 'fs';

import { copyDirectory, feedback, getAbsoluteLibDirPath } from '#utils';
import BuildStatic from './statics/index.js';

/**
 * If a relative path exists, copy public path to root
 * @param {string} pathPrefix - prefix
 * @param {string} rootDir - application root dir
 */
function handlePublicDir(pathPrefix, rootDir) {
  const validPathPrefix =
    pathPrefix && typeof pathPrefix === 'string' && pathPrefix !== '';

  if (validPathPrefix) {
    const srcPublicDir = path.resolve(pathPrefix, 'public');
    const destPublicDir = path.resolve(rootDir, 'public');
    copyDirectory(srcPublicDir, destPublicDir);
  }
}

/**
 * Run actions to build next for node runtime.
 * @param {string} nextVersion - project next version in package.json
 * @param {object} buildContext - info about the build
 */
async function run(nextVersion, buildContext) {
  feedback.prebuild.info('Running build for next node server ...');

  const version = valid(coerce(nextVersion));
  const MESSAGE_ERROR_VERSION =
    'Invalid Next.js version! Available versions for node runtime: 12.3.1';
  if (gte(version, '12.3.0') && lt(version, '12.4.0')) {
    feedback.prebuild.info('Starting file processing!');

    const OUT_DIR_CUSTOM_SERVER = '.edge/next-build';

    // INIT FOLDER CUSTOM SERVER
    const CUSTOM_SERVER_DIR = 'custom-server';
    const CURRENT_VERSION = version;
    const vulcanLibPath = getAbsoluteLibDirPath();
    const customServerPath = join(
      vulcanLibPath,
      'presets',
      'custom',
      'next',
      'compute',
      'node',
      CUSTOM_SERVER_DIR,
      CURRENT_VERSION,
    );
    const rootDir = process.cwd();
    // try version dir
    const outPathCustomServer = path.resolve(
      OUT_DIR_CUSTOM_SERVER,
      'custom-server',
    );
    try {
      copyDirectory(customServerPath, outPathCustomServer);
    } catch (error) {
      feedback.prebuild.error(MESSAGE_ERROR_VERSION);
      fs.rmSync(OUT_DIR_CUSTOM_SERVER, { recursive: true });
      process.exit(1);
    }

    // STATICS
    // copy to root public dir if necessary
    if (buildContext.memoryFS) {
      handlePublicDir(buildContext.memoryFS.removePathPrefix, rootDir);
    }

    const buildStatic = new BuildStatic({
      rootDir,
      includeDirs: ['./.next', './public'],
      staticDirs: ['./public', '.next/static'],
      excludeDirs: ['./.next/cache', 'node_modules'],
      out: OUT_DIR_CUSTOM_SERVER,
      versionId: buildContext.buildId,
    });

    buildStatic.run();
  } else {
    feedback.prebuild.error(MESSAGE_ERROR_VERSION);

    process.exit(1);
  }
}

export default run;
