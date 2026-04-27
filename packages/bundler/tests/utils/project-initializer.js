import { feedback } from '@aziontech/utils/node';
import { waitForVulcanServer, execCommandInContainer } from './docker-env-actions.js';

/**
 * Run actions to build and run project in docker container
 * @param {string} examplePath - project path in container
 * @param {string} preset - bundler preset to build
 * @param {number} serverPort - port to use in bundler server
 * @param {boolean} installPkgs - dependencies need to be installed?
 * @param {string} url - url test container
 * @param {boolean} isFirewall - is firewall project
 * @param {string} entryPoint - entry point file (optional)
 * @param {Object} env - environment variables to pass to the build command
 */
async function projectInitializer(
  examplePath,
  preset,
  serverPort,
  installPkgs = true,
  url = 'http://localhost',
  isFirewall = false,
  entryPoint = null,
  env = {},
) {
  const example = examplePath.replace('/examples/', '');
  const bundlerCmd = 'npx --yes --registry=http://verdaccio:4873 @aziontech/bundler@latest';

  if (installPkgs) {
    feedback.info(`[${example}] Installing project dependencies ...`);
    await execCommandInContainer('pnpm install --no-engine-strict --ignore-scripts', examplePath);
  }

  feedback.info(`[${example}] Building the project ...`);
  await execCommandInContainer(
    `${bundlerCmd} build --preset ${preset} ${isFirewall ? '--firewall' : ''} ${
      entryPoint ? `--entry ${entryPoint}` : ''
    }`,
    examplePath,
    false,
    'test',
    'E2E test',
    env,
  );

  feedback.info(`[${example}] Starting Bundler local server ...`);
  await execCommandInContainer(
    `${bundlerCmd} dev -p ${serverPort} ${isFirewall ? '--firewall' : ''} --skip-framework-build`,
    examplePath,
    true,
  );

  await waitForVulcanServer(`${url}:${serverPort}`);

  feedback.info(`[${example}] Bundler local server started!`);
}

export default projectInitializer;
