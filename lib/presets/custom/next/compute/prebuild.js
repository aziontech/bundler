import {
  readFileSync, writeFileSync, existsSync, mkdirSync,
} from 'fs';
import glob from 'fast-glob';

import { feedback, getPackageVersion, exec } from '#utils';
import runDefaultBuild from './default/index.js';
import runNodeBuild from './node/index.js';

/**
 * Create vercel project config when necessary.
 */
async function generateVercelProjectConfig() {
  const configFilePath = '.vercel/project.json';

  if (!existsSync(configFilePath)) {
    feedback.prebuild.warn('Vercel output not found, generating files ...');

    mkdirSync('.vercel');
    writeFileSync(configFilePath, '{"projectId":"_","orgId":"_","settings":{}}');

    await exec('npx --yes vercel@28.18.3 build --prod');
  }
}

/**
 * Get project used runtimes.
 * @returns {string} runtime 'node', 'edge' or 'all'.
 */
async function getProjectRuntimes() {
  let useNode = false;
  let useEdge = false;

  try {
    await generateVercelProjectConfig();

    const vcConfigPaths = glob.sync('.vercel/output/functions/**/.vc-config.json');
    const vcConfigObjects = vcConfigPaths.map((file) => ({
      path: file,
      content: JSON.parse(readFileSync(file, 'utf8')),
    }));

    const runtimes = [...(new Set(vcConfigObjects.map((config) => config.content.runtime)))];
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

  const projectRuntime = await getProjectRuntimes();
  if (projectRuntime === 'node') {
    await runNodeBuild(nextVersion);
  } else {
    await runDefaultBuild(nextVersion);
  }

  feedback.prebuild.success('Next.js build adaptation completed successfully.');
}

export default prebuild;
