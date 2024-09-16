import path, { join } from 'path';
import fs from 'fs';

import { copyDirectory, debug, feedback, getAbsoluteLibDirPath } from '#utils';
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

  feedback.prebuild.info('Starting file processing!');

  const OUT_DIR_CUSTOM_SERVER = '.edge/next-build';

  // INIT FOLDER CUSTOM SERVER
  const CUSTOM_SERVER_DIR = 'custom-server';
  const CURRENT_VERSION = nextVersion;
  const vulcanLibPath = getAbsoluteLibDirPath();
  const customServerPath = join(
    vulcanLibPath,
    'presets',
    'next',
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
    feedback.prebuild.error(
      `Custom server path not found for version ${CURRENT_VERSION}!`,
    );
    debug.error(error);
    fs.rmSync(OUT_DIR_CUSTOM_SERVER, { recursive: true });
    process.exit(1);
  }

  // STATICS
  // copy to root public dir if necessary
  if (buildContext.memoryFS) {
    handlePublicDir(buildContext.memoryFS.removePathPrefix, rootDir);
  }

  // It is necessary to replace the static directories for the .vercel output,
  // which has the _next pattern and the public folder does not exist
  // as the files are in the root (.vercel/output/static).
  const buildStatic = new BuildStatic({
    rootDir,
    includeDirs: ['./.next', './public'],
    staticDirs: [
      { name: './public', replace: '/' },
      { name: './.next/static', replace: './_next/static' },
    ],
    excludeDirs: ['./.next/cache', 'node_modules'],
    out: OUT_DIR_CUSTOM_SERVER,
    versionId: buildContext.buildId,
  });

  buildStatic.run();
}

export default run;
