import { readFileSync } from 'fs';
import { resolve } from 'path';
import glob from 'fast-glob';

import {
  feedback,
  getPackageVersion,
  VercelUtils,
  Manifest,
  copyDirectory,
} from '#utils';

import runDefaultBuild from './default/prebuild/index.js';
import runNodeBuild from './node/prebuild/index.js';

const { deleteTelemetryFiles, createVercelProjectConfig, runVercelBuild } =
  VercelUtils;

// TODO: improve validations (node version, next version, next runtimes, features ...)

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
 * Get project used runtimes.
 * @returns {string} runtime 'node', 'edge' or 'all'.
 */
function getProjectRuntimes() {
  let useNode = false;
  let useEdge = false;

  try {
    const vcConfigPaths = glob.sync(
      '.vercel/output/functions/**/.vc-config.json',
    );
    const vcConfigObjects = vcConfigPaths.map((file) => ({
      path: file,
      content: JSON.parse(readFileSync(file, 'utf8')),
    }));

    const runtimes = [
      ...new Set(vcConfigObjects.map((config) => config.content.runtime)),
    ];
    runtimes.forEach((runtime) => {
      // node versions format = nodejsX.x
      if (runtime.includes('node')) {
        useNode = true;
      }
      if (runtime.includes('edge')) {
        useEdge = true;
      }
    });
  } catch (error) {
    feedback.prebuild.error(error);
    process.exit(1);
  }

  if (useEdge && useNode) return 'all';
  if (useNode && !useEdge) return 'node';

  return 'edge';
}

/**
 * @function
 * @async
 * @description Generates the manifest file from the defined static assets and routes.
 */
function generateManifest() {
  const staticsFilePath = resolve(process.cwd(), '.edge/next-build/statics.js');
  const staticsFileContent = readFileSync(staticsFilePath, 'utf8');

  // Extract the assets object from the file content
  const assetsMatch = staticsFileContent.match(
    /export const assets = ({[\s\S]*?});/,
  );
  if (!assetsMatch) {
    throw new Error('Could not find assets object in statics.js');
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

  const nextVersion = getPackageVersion('next');

  feedback.prebuild.info('Detected Next.js version:', nextVersion);

  await vercelPrebuildActions();

  const projectRuntime = getProjectRuntimes();

  // build node functions (custom node server)
  if (projectRuntime === 'node' || projectRuntime === 'all') {
    await runNodeBuild(nextVersion, buildContext);
  }

  // build routing system and edge functions
  const prebuildResult = await runDefaultBuild();

  generateManifest();

  copyVercelStaticGeneratedFiles();

  feedback.prebuild.success('Next.js build adaptation completed successfully.');

  return prebuildResult;
}

export default prebuild;
