import { readFileSync } from 'fs';
import { resolve } from 'path';

import { feedback, VercelUtils, generateManifest, copyDirectory } from '#utils';
import { Messages } from '#constants';

import runDefaultBuild from './default/prebuild/index.js';
import runNodeBuild from './node/prebuild/index.js';
import { validationSupportAndRetrieveFromVcConfig } from './default/prebuild/validation/support.js';

const { deleteTelemetryFiles, createVercelProjectConfig, runVercelBuild } =
  VercelUtils;

const edgeManifest = {
  rules: {
    request: [
      {
        match: '/^/_next/static/;', // starts with '/_next/static/'
        setOrigin: {
          type: 'object_storage',
        },
        deliver: true,
      },
      {
        match: '.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4)$',
        setOrigin: {
          type: 'object_storage',
        },
        deliver: true,
      },
      {
        match: '^/',
        runFunction: {
          path: '.edge/worker.js',
        },
        forwardCookies: true,
      },
    ],
  },
};
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
async function generateNextManifest(runtimes) {
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

  await generateManifest(edgeManifest);
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
    invalidFunctions,
  } = await validationSupportAndRetrieveFromVcConfig();

  feedback.prebuild.info('Detected Next.js version:', nextVersion);
  if (!validSupport) {
    feedback.prebuild.error(
      Messages.build.error.prebuild_error_validation_support(
        'Nextjs',
        nextVersion,
        projectRuntimes,
        invalidFunctions,
      ),
    );
    process.exit(1);
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

  await generateNextManifest(projectRuntimes);

  copyVercelStaticGeneratedFiles();

  feedback.prebuild.success('Next.js build adaptation completed successfully.');

  return prebuildResult;
}

export default prebuild;
