import { readFileSync } from 'fs';
import glob from 'fast-glob';

import { feedback, getPackageVersion, VercelUtils } from '#utils';
import runDefaultBuild from './default/index.js';
import runNodeBuild from './node/index.js';

const { deleteTelemetryFiles, createVercelProjectConfig, runVercelBuild } = VercelUtils;

/**
 * Create vercel project config when necessary.
 */
function vercelPrebuildActions() {
  try {
    feedback.prebuild.info('Checking vercel config file ...');
    createVercelProjectConfig();

    feedback.prebuild.info('Running Next.js vercel build ...');
    runVercelBuild();

    feedback.prebuild.info('Cleaning files ...');
    deleteTelemetryFiles();
  } catch (error) {
    feedback.prebuild.error(error);
    process.exit(0);
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
    const vcConfigPaths = glob.sync('.vercel/output/functions/**/.vc-config.json');
    const vcConfigObjects = vcConfigPaths.map((file) => ({
      path: file,
      content: JSON.parse(readFileSync(file, 'utf8')),
    }));

    const runtimes = [...new Set(vcConfigObjects.map((config) => config.content.runtime))];
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
    process.exit(0);
  }

  if (useEdge && useNode) return 'all';
  if (useNode && !useEdge) return 'node';

  return 'edge';
}

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
async function prebuild(buildContext) {
  feedback.prebuild.info('Starting Next.js build process ...');

  const nextVersion = getPackageVersion('next');

  feedback.prebuild.info('Detected Next.js version:', nextVersion);

  vercelPrebuildActions();

  const projectRuntime = getProjectRuntimes();
  if (projectRuntime === 'node') {
    await runNodeBuild(nextVersion, buildContext);
  } else if (projectRuntime === 'all') {
    throw new Error('Invalid runtimes in your Next.js project. Use only \'node\' or only \'edge\' in your project.');
  } else {
    // edge runtime
    await runDefaultBuild(nextVersion);
  }

  feedback.prebuild.success('Next.js build adaptation completed successfully.');
}

export default prebuild;
