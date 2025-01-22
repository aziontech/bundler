import { feedback } from '#utils';
import {
  waitForVulcanServer,
  execCommandInContainer,
} from './docker-env-actions.js';

/**
 * Run actions to build and run project in docker container
 * @param {string} examplePath - project path in container
 * @param {string} preset - bundler preset to build
 * @param {number} serverPort - port to use in bundler server
 * @param {boolean} installPkgs - dependencies need to be installed?
 * @param {string} url - url test container
 * @param {boolean} isFirewall - is firewall project
 */
async function projectInitializer(
  examplePath,
  preset,
  serverPort,
  installPkgs = true,
  url = 'http://localhost',
  isFirewall = false,
) {
  const example = examplePath.replace('/examples/', '');
  const bundlerCmd =
    'npx --yes --registry=http://verdaccio:4873 edge-functions@latest';

  if (installPkgs) {
    feedback.info(`[${example}] Installing project dependencies ...`);
    await execCommandInContainer('yarn --ignore-engines', examplePath);
  }

  feedback.info(`[${example}] Building the project ...`);
  await execCommandInContainer(
    `${bundlerCmd} build --preset ${preset} ${isFirewall ? '--firewall' : ''}`,
    examplePath,
  );

  feedback.info(`[${example}] Starting Bundler local server ...`);
  await execCommandInContainer(
    `${bundlerCmd} dev -p ${serverPort} ${isFirewall ? '--firewall' : ''}`,
    examplePath,
    true,
  );

  await waitForVulcanServer(`${url}:${serverPort}`);

  feedback.info(`[${example}] Bundler local server started!`);
}

export default projectInitializer;
