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
 * @param {string} installArgs - additional arguments for pnpm install (optional)
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
  installArgs = '',
) {
  const example = examplePath.replace('/examples/', '');
  // Some examples have a .npmrc with "min-release-age", which makes npm (11+) skip versions published in
  // the last days. The bundler under test was just published in verdaccio, and a new @aziontech/* release
  // is also recent, so npx fails with ENOVERSIONS or ETARGET. min-release-age-exclude does not apply to the
  // package npx runs, so the wait is turned off for this command. The project dependencies are not affected,
  // they are installed by pnpm.
  const bundlerCmd =
    'npx --yes --min-release-age=0 --registry=http://verdaccio:4873 @aziontech/bundler@latest';

  if (installPkgs) {
    feedback.info(`[${example}] Installing project dependencies ...`);
    await execCommandInContainer(
      `pnpm install --no-engine-strict ${installArgs}`.trim(),
      examplePath,
    );
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
