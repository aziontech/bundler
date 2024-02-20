import { readFileSync } from 'fs';
import { resolve } from 'path';

import { feedback, VercelUtils, Manifest, copyDirectory } from '#utils';
import { Messages } from '#constants';

import runDefaultBuild from './default/prebuild/index.js';
import runNodeBuild from './node/prebuild/index.js';
import { validationSupportAndRetrieveFromVcConfig } from './default/prebuild/validation/support.js';

const { deleteTelemetryFiles, createVercelProjectConfig, runVercelBuild } =
  VercelUtils;

/**
 * Create vercel project config when necessary.
 */
async function vercelPrebuildActions() {
  try {
    feedback.prebuild.info('Checking vercel config file ...');
    createVercelProjectConfig();

    feedback.prebuild.info('Running Next.js vercel build ...');
    await runVercelBuild();

    feedback.prebuild.info('Cleaning files ...');
    deleteTelemetryFiles();
  } catch (error) {
    feedback.prebuild.error(error);
    process.exit(1);
  }
}

/**
 * @param {string[]} runtimes - The runtime to use. eg. ['node', 'edge']
 * @function
 * @async
 * @description Generates the manifest file from the defined static assets and routes.
 */
function generateManifest(runtimes) {
  if (runtimes.includes('node')) {
    const staticsFilePath = resolve(
      process.cwd(),
      '.edge/next-build/statics.js',
    );
    const staticsFileContent = readFileSync(staticsFilePath, 'utf8');

    // Extract the assets object from the file content
    const assetsMatch = staticsFileContent.match(
      /export const assets = ({[\s\S]*?});/,
    );
    if (!assetsMatch) {
      throw new Error('Could not find assets object in statics.js');
    }
  }

  Manifest.setRoute({
    from: '/_next/static/',
    to: '.edge/storage',
    priority: 1,
    type: 'deliver',
  });
  Manifest.setRoute({
    from: '/_next/data/',
    to: '.edge/storage',
    priority: 2,
    type: 'deliver',
  });
  Manifest.setRoute({
    from: '\\.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4)$',
    to: '.edge/storage',
    priority: 3,
    type: 'deliver',
  });
  Manifest.setRoute({
    from: '/',
    to: '.edge/worker.js',
    priority: 4,
    type: 'compute',
  });

  Manifest.generate();
}

/**
 *
 */
function copyVercelStaticGeneratedFiles() {
  copyDirectory('.vercel/output/static', '.edge/storage');
}

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 * @returns {object} - info about the build
 */
async function prebuild(buildContext) {
  feedback.prebuild.info('Starting Next.js build process ...');

  await vercelPrebuildActions();

  const {
    vcConfigObjects,
    valid: validSupport,
    version: nextVersion,
    runtimes: projectRuntimes,
    minorVersion,
  } = await validationSupportAndRetrieveFromVcConfig();

  feedback.prebuild.info('Detected Next.js version:', nextVersion);
  if (!validSupport) {
    throw new Error(
      Messages.build.error.prebuild_error_validation_support(
        'Nextjs',
        nextVersion,
        projectRuntimes,
      ),
    );
  }

  // build node functions (custom node server)
  if (projectRuntimes.includes('node')) {
    await runNodeBuild(minorVersion, buildContext);
  }

  // build routing system and edge functions
  const prebuildResult = await runDefaultBuild({
    vcConfigObjects,
    nextVersion,
    projectRuntimes,
  });

  // remove node handler inject on handler
  const nodeHandlerFile =
    'lib/presets/custom/next/compute/node/handler/index.js';

  if (
    Array.isArray(projectRuntimes) &&
    projectRuntimes.length === 1 &&
    projectRuntimes[0] === 'edge'
  ) {
    prebuildResult.filesToInject = prebuildResult.filesToInject.filter(
      (file) => !file.includes(nodeHandlerFile),
    );
  }

  generateManifest(projectRuntimes);

  copyVercelStaticGeneratedFiles();

  feedback.prebuild.success('Next.js build adaptation completed successfully.');

  return prebuildResult;
}

export default prebuild;
