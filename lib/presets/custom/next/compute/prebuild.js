import { readFileSync } from 'fs';
import { resolve } from 'path';
import glob from 'fast-glob';

import { feedback, getPackageVersion, VercelUtils, Manifest } from '#utils';

import runDefaultBuild from './default/index.js';
import runNodeBuild from './node/index.js';

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

  // Filter only the isStatic assets before parsing
  const isStaticAssetsString = assetsMatch[1].replace(
    /"[^"]+": \{[^}]*isStatic: false[^}]*\},?/g,
    '',
  );

  // eslint-disable-next-line no-eval
  const assets = eval(`(${isStaticAssetsString})`);
  const statics = Object.entries(assets);

  Manifest.setRoute('compute', {
    from: '/',
    to: '/worker.js',
    priority: 1,
  });

  statics.forEach(([path]) => {
    Manifest.setRoute('deliver', {
      from: path, // use the key as 'from'
      to: path.replace(/^\/\.next/, '').replace(/^\/public/, ''),
      priority: 1,
    });
  });

  Manifest.generate();
}

/**
 * Runs custom prebuild actions
 * @param {object} buildContext - info about the build
 */
async function prebuild(buildContext) {
  feedback.prebuild.info('Starting Next.js build process ...');

  const nextVersion = getPackageVersion('next');

  feedback.prebuild.info('Detected Next.js version:', nextVersion);

  await vercelPrebuildActions();

  const projectRuntime = getProjectRuntimes();
  if (projectRuntime === 'node') {
    await runNodeBuild(nextVersion, buildContext);
  } else if (projectRuntime === 'all') {
    throw new Error(
      "Invalid runtimes in your Next.js project. Use only 'node' or only 'edge' in your project.",
    );
  } else {
    // edge runtime
    await runDefaultBuild(nextVersion);
  }

  generateManifest();

  feedback.prebuild.success('Next.js build adaptation completed successfully.');
}

export default prebuild;
